// Skill system — define new skills by combining Effects with a TargetRule.

import type {Combatant} from './combatant.js';
import type {Effect} from './effect.js';
import type {TargetRule} from './types.js';

export interface BattleAction {
	actor: Combatant;
	skill: Skill;
	targets: Combatant[];
	priority: number;
	speedSnapshot: number;
}

export class Skill {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string,
		public readonly costMp: number,
		public readonly targetRule: TargetRule,
		public readonly priority: number,
		public readonly effects: Effect[],
	) {}

	canUse(user: Combatant): boolean {
		return user.resources.mp >= this.costMp;
	}

	createAction(user: Combatant, targets: Combatant[]): BattleAction {
		return {
			actor: user,
			skill: this,
			targets,
			priority: this.priority,
			speedSnapshot: user.getFinalStats().speed,
		};
	}
}
