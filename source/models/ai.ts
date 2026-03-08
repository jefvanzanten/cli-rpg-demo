// Simple random AI controller.
// To add smarter AI: subclass AIController and override chooseAction.

import type {Combatant} from './combatant.js';
import type {BattleAction} from './skill.js';

/** Minimal view of the battle the AI needs — avoids circular imports. */
export interface AIBattleView {
	alivePlayers: Combatant[];
	aliveEnemies: Combatant[];
}

export class AIController {
	chooseAction(
		battle: AIBattleView,
		self: Combatant,
	): BattleAction | undefined {
		const usable = self.skills.filter(s => s.canUse(self));
		if (usable.length === 0) return undefined;

		const skill = usable[Math.floor(Math.random() * usable.length)]!;
		let targets: Combatant[] = [];

		switch (skill.targetRule.type) {
			case 'single-enemy': {
				const enemies = battle.alivePlayers;
				if (enemies.length === 0) return undefined;
				targets = [enemies[Math.floor(Math.random() * enemies.length)]!];
				break;
			}

			case 'all-enemies': {
				targets = [...battle.alivePlayers];
				break;
			}

			case 'single-ally': {
				const allies = battle.aliveEnemies;
				if (allies.length === 0) return undefined;
				targets = [allies[Math.floor(Math.random() * allies.length)]!];
				break;
			}

			case 'self': {
				targets = [self];
				break;
			}
		}

		if (targets.length === 0) return undefined;
		return skill.createAction(self, targets);
	}
}
