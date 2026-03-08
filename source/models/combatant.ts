// Combatant — a single fighter in battle (player character or enemy).
// Circular dep with skill.ts is intentional and safe: neither module
// executes the other's code at import time.

import type {StatBlock, ResourcePool, StatModifier} from './types.js';
import type {Skill} from './skill.js';

export class Combatant {
	readonly modifiers: StatModifier[] = [];

	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly baseStats: StatBlock,
		public readonly resources: ResourcePool,
		public readonly skills: Skill[],
		public readonly isPlayer: boolean,
	) {}

	canAct(): boolean {
		return this.resources.hp > 0;
	}

	takeDamage(amount: number): void {
		this.resources.hp = Math.max(0, this.resources.hp - amount);
	}

	heal(amount: number): void {
		this.resources.hp = Math.min(
			this.resources.maxHp,
			this.resources.hp + amount,
		);
	}

	spendMp(amount: number): void {
		this.resources.mp = Math.max(0, this.resources.mp - amount);
	}

	addModifier(mod: StatModifier): void {
		this.modifiers.push(mod);
	}

	/** Called at the end of each round to decrement and remove expired modifiers. */
	tickModifiers(): void {
		for (let i = this.modifiers.length - 1; i >= 0; i--) {
			const mod = this.modifiers[i]!;
			mod.duration--;
			if (mod.duration <= 0) {
				this.modifiers.splice(i, 1);
			}
		}
	}

	/** Returns effective stats after all active modifiers are applied. */
	getFinalStats(): StatBlock {
		const stats = {...this.baseStats};
		for (const mod of this.modifiers) {
			stats[mod.stat] += mod.amount;
		}

		return stats;
	}
}
