// Effect system — extend by adding new Effect subclasses.
// Each effect is self-contained and stateless; you can reuse them across skills.

import type {Combatant} from './combatant.js';
import type {StatBlock, StatModifier} from './types.js';

export type LogFn = (message: string) => void;

export abstract class Effect {
	abstract apply(source: Combatant, target: Combatant, log: LogFn): void;
}

/** Deals physical or magical damage to a single target. */
export class DamageEffect extends Effect {
	constructor(
		public readonly power: number,
		public readonly scaling: 'attack' | 'magic' = 'attack',
	) {
		super();
	}

	override apply(source: Combatant, target: Combatant, log: LogFn): void {
		const src = source.getFinalStats();
		const tgt = target.getFinalStats();
		const atk = this.scaling === 'magic' ? src.magic : src.attack;
		const def = this.scaling === 'magic' ? tgt.resistance : tgt.defense;
		const damage = Math.max(1, this.power + atk - def);
		target.takeDamage(damage);
		log(`  ${target.name} takes ${damage} damage`);
	}
}

/** Restores HP to a target, scaling with the caster's magic stat. */
export class HealEffect extends Effect {
	constructor(public readonly power: number) {
		super();
	}

	override apply(source: Combatant, target: Combatant, log: LogFn): void {
		const amount = this.power + Math.floor(source.getFinalStats().magic / 3);
		target.heal(amount);
		log(`  ${target.name} recovers ${amount} HP`);
	}
}

/** Temporarily modifies a stat for a number of turns. */
export class BuffEffect extends Effect {
	constructor(
		public readonly stat: keyof StatBlock,
		public readonly amount: number,
		public readonly duration: number,
	) {
		super();
	}

	override apply(_source: Combatant, target: Combatant, log: LogFn): void {
		const mod: StatModifier = {
			stat: this.stat,
			amount: this.amount,
			duration: this.duration,
		};
		target.addModifier(mod);
		const sign = this.amount >= 0 ? '+' : '';
		log(
			`  ${target.name}'s ${this.stat} ${sign}${this.amount} for ${this.duration} turns`,
		);
	}
}
