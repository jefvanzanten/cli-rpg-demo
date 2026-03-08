// Demo data — your wizard & knight vs two goblins.
// Add new characters or skills here to extend the demo.

import {Combatant} from './combatant.js';
import {DamageEffect, HealEffect, BuffEffect} from './effect.js';
import {Skill} from './skill.js';
import {AIController} from './ai.js';
import type {Party} from './battle.js';

// ── Wizard skills ────────────────────────────────────────────────────────────

const fireball = new Skill(
	'fireball',
	'Fireball',
	'Magic damage to one enemy',
	10,
	{type: 'single-enemy'},
	1,
	[new DamageEffect(20, 'magic')],
);

const arcaneBlast = new Skill(
	'arcane_blast',
	'Arcane Blast',
	'Magic damage to ALL enemies',
	20,
	{type: 'all-enemies'},
	0,
	[new DamageEffect(12, 'magic')],
);

const healSpell = new Skill(
	'heal',
	'Heal',
	'Restore own HP',
	15,
	{type: 'self'},
	2,
	[new HealEffect(20)],
);

// ── Knight skills ────────────────────────────────────────────────────────────

const slash = new Skill(
	'slash',
	'Slash',
	'Basic sword attack',
	0,
	{type: 'single-enemy'},
	1,
	[new DamageEffect(10, 'attack')],
);

const shieldBash = new Skill(
	'shield_bash',
	'Shield Bash',
	'Attack + raise own defense',
	5,
	{type: 'single-enemy'},
	0,
	[new DamageEffect(8, 'attack'), new BuffEffect('defense', 3, 2)],
);

// ── Goblin skills ────────────────────────────────────────────────────────────

const scratch = new Skill(
	'scratch',
	'Scratch',
	'Weak goblin scratch',
	0,
	{type: 'single-enemy'},
	1,
	[new DamageEffect(5, 'attack')],
);

const bite = new Skill(
	'bite',
	'Bite',
	'Goblin bites hard',
	0,
	{type: 'single-enemy'},
	0,
	[new DamageEffect(8, 'attack')],
);

// ── Factory ──────────────────────────────────────────────────────────────────

export type DemoData = {
	playerParty: Party;
	enemyParty: Party;
	aiMap: Map<string, AIController>;
};

export function createDemo(): DemoData {
	const goblinAI = new AIController();
	const aiMap = new Map<string, AIController>();

	const wizard = new Combatant(
		'wizard',
		'Wizard',
		{maxHp: 60, attack: 5, defense: 4, magic: 18, resistance: 10, speed: 12},
		{hp: 60, mp: 80, maxHp: 60, maxMp: 80},
		[fireball, arcaneBlast, healSpell],
		true,
	);

	const knight = new Combatant(
		'knight',
		'Knight',
		{
			maxHp: 100,
			attack: 15,
			defense: 12,
			magic: 2,
			resistance: 6,
			speed: 8,
		},
		{hp: 100, mp: 20, maxHp: 100, maxMp: 20},
		[slash, shieldBash],
		true,
	);

	const goblinA = new Combatant(
		'goblin_a',
		'Goblin A',
		{maxHp: 40, attack: 8, defense: 5, magic: 2, resistance: 3, speed: 10},
		{hp: 40, mp: 0, maxHp: 40, maxMp: 0},
		[scratch, bite],
		false,
	);

	const goblinB = new Combatant(
		'goblin_b',
		'Goblin B',
		{maxHp: 40, attack: 8, defense: 5, magic: 2, resistance: 3, speed: 9},
		{hp: 40, mp: 0, maxHp: 40, maxMp: 0},
		[scratch, bite],
		false,
	);

	aiMap.set(goblinA.id, goblinAI);
	aiMap.set(goblinB.id, goblinAI);

	return {
		playerParty: {name: 'Heroes', members: [wizard, knight], isPlayer: true},
		enemyParty: {
			name: 'Goblins',
			members: [goblinA, goblinB],
			isPlayer: false,
		},
		aiMap,
	};
}
