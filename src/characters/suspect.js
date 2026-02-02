/**
 * 🎭 Suspect / Unreliable Witness — by Chotu 😈
 * 
 * NPCs who may or may not tell the truth.
 * Reliability is a spectrum, not a boolean.
 */

class Suspect {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role || 'witness';
    this.reliability = config.reliability ?? 0.7; // 0 = compulsive liar, 1 = honest
    this.nervousness = config.nervousness ?? 0.3; // Affects dialogue style
    this.secrets = config.secrets || [];
    this.testimonies = config.testimonies || {};
    this.questionsAsked = [];
    this.contradictions = [];
    this.mood = 'neutral'; // neutral, nervous, defensive, cooperative, hostile
  }

  /**
   * Ask the suspect a question
   * @param {string} topic - What you're asking about
   * @param {Object} gameState - Current game state for context
   * @returns {Object} response
   */
  ask(topic, gameState = {}) {
    this.questionsAsked.push({ topic, timestamp: Date.now() });

    // Check if we have a scripted testimony for this topic
    const testimony = this.testimonies[topic];
    if (!testimony) {
      return this.deflect(topic);
    }

    // Decide if the suspect tells the truth
    const tellsTruth = Math.random() < this.getEffectiveReliability(gameState);

    const response = tellsTruth ? testimony.truth : testimony.lie;

    // Track potential contradictions
    if (!tellsTruth) {
      this.contradictions.push({
        topic,
        claimed: testimony.lie,
        truth: testimony.truth,
        detectable: testimony.contradictionClue || null,
      });
    }

    // Update mood based on questioning pressure
    this.updateMood();

    return {
      speaker: this.name,
      text: response,
      mood: this.mood,
      reliable: tellsTruth,
      // Don't expose reliability to the player!
      bodyLanguage: this.getBodyLanguage(tellsTruth),
    };
  }

  /**
   * Get effective reliability — decreases under pressure
   */
  getEffectiveReliability(gameState) {
    let reliability = this.reliability;

    // More questions = more pressure = more lies (or more cracks)
    if (this.questionsAsked.length > 3) {
      reliability -= 0.1;
    }
    if (this.questionsAsked.length > 6) {
      reliability -= 0.1;
    }

    // If player has found contradicting evidence, suspect gets nervous
    if (gameState.contradictingEvidence) {
      reliability += 0.2; // Scared into honesty
      this.nervousness = Math.min(1, this.nervousness + 0.3);
    }

    return Math.max(0.1, Math.min(1, reliability));
  }

  /**
   * When asked about something with no scripted answer
   */
  deflect(topic) {
    const deflections = [
      `"I don't know anything about ${topic}."`,
      `"Why are you asking me about that?"`,
      `"I... I'd rather not talk about it."`,
      `*${this.name} looks away and changes the subject.*`,
      `"Ask someone else. I wasn't paying attention."`,
      `"That's not really my area, detective."`,
    ];

    return {
      speaker: this.name,
      text: deflections[Math.floor(Math.random() * deflections.length)],
      mood: this.mood,
      reliable: null, // Neither truth nor lie — just avoidance
      bodyLanguage: 'evasive',
    };
  }

  /**
   * Body language hints — subtle tells for the player
   */
  getBodyLanguage(tellsTruth) {
    if (tellsTruth) {
      const honest = ['calm', 'direct eye contact', 'relaxed posture', 'steady voice'];
      return honest[Math.floor(Math.random() * honest.length)];
    }

    const dishonest = [
      'fidgets with hands',
      'avoids eye contact',
      'touches face',
      'speaks faster than usual',
      'crosses arms',
      'long pause before answering',
    ];
    return dishonest[Math.floor(Math.random() * dishonest.length)];
  }

  /**
   * Update mood based on interrogation pressure
   */
  updateMood() {
    const questionCount = this.questionsAsked.length;
    if (questionCount <= 2) this.mood = 'cooperative';
    else if (questionCount <= 4) this.mood = 'neutral';
    else if (questionCount <= 6) this.mood = 'nervous';
    else if (questionCount <= 8) this.mood = 'defensive';
    else this.mood = 'hostile';
  }

  /**
   * Confront with evidence — can crack a suspect
   * @param {string} evidenceId 
   * @param {Object} evidence 
   */
  confront(evidenceId, evidence) {
    const relevantContradiction = this.contradictions.find(
      c => c.detectable === evidenceId
    );

    if (relevantContradiction) {
      this.reliability = Math.min(1, this.reliability + 0.4);
      this.mood = 'nervous';
      return {
        speaker: this.name,
        text: `*${this.name}'s face drains of color.* "Okay... okay. I wasn't completely honest about ${relevantContradiction.topic}."`,
        cracked: true,
        revelation: relevantContradiction.truth,
        bodyLanguage: 'defeated',
      };
    }

    return {
      speaker: this.name,
      text: `"I don't see what that has to do with me."`,
      cracked: false,
      bodyLanguage: this.mood === 'hostile' ? 'aggressive' : 'dismissive',
    };
  }

  /**
   * Check if suspect has any unresolved contradictions
   */
  hasContradictions() {
    return this.contradictions.length > 0;
  }

  getProfile() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      mood: this.mood,
      questionsAsked: this.questionsAsked.length,
      // Don't expose reliability or contradictions!
    };
  }
}

module.exports = { Suspect };
