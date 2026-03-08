// Core data types for the RPG battle system.
// Extend these interfaces to add new stats or rules.

export interface StatBlock {
	maxHp: number;
	attack: number;
	defense: number;
	magic: number;
	resistance: number;
	speed: number;
}

export interface ResourcePool {
	hp: number;
	mp: number;
	maxHp: number;
	maxMp: number;
}

export type TargetRuleType =
	| 'single-enemy'
	| 'all-enemies'
	| 'single-ally'
	| 'self';

export interface TargetRule {
	type: TargetRuleType;
}

export interface StatModifier {
	stat: keyof StatBlock;
	amount: number;
	duration: number; // turns remaining — decremented at round end
}

export interface LogEntry {
	id: number;
	message: string;
}
