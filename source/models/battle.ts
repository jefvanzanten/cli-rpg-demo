// Battle — the core game loop engine.
// It is driven externally (by the UI) via executeAction() and advanceTurn().

import type {Combatant} from './combatant.js';
import type {BattleAction} from './skill.js';
import type {LogEntry} from './types.js';

export interface Party {
	name: string;
	members: Combatant[];
	isPlayer: boolean;
}

let logIdCounter = 0;

export class Battle {
	readonly log: LogEntry[] = [];
	round = 1;

	// Turn queue for the current round, sorted by speed descending.
	readonly turnQueue: Combatant[] = [];
	currentActorIndex = 0;

	constructor(
		public readonly playerParty: Party,
		public readonly enemyParty: Party,
	) {}

	get allCombatants(): Combatant[] {
		return [...this.playerParty.members, ...this.enemyParty.members];
	}

	get alivePlayers(): Combatant[] {
		return this.playerParty.members.filter(c => c.canAct());
	}

	get aliveEnemies(): Combatant[] {
		return this.enemyParty.members.filter(c => c.canAct());
	}

	get currentActor(): Combatant | undefined {
		return this.turnQueue[this.currentActorIndex];
	}

	addLog(message: string): void {
		this.log.push({id: ++logIdCounter, message});
	}

	/** Build the turn order for a new round based on speed stats. */
	buildTurnQueue(): void {
		this.turnQueue.length = 0;
		const sorted = this.allCombatants
			.filter(c => c.canAct())
			.sort((a, b) => b.getFinalStats().speed - a.getFinalStats().speed);
		this.turnQueue.push(...sorted);
		this.currentActorIndex = 0;
	}

	/** Execute a BattleAction: spends MP and applies all effects. */
	executeAction(action: BattleAction): void {
		const {actor, skill, targets} = action;
		const alive = targets.filter(t => t.canAct());
		if (alive.length === 0) {
			this.addLog(`${actor.name} attacks but the target is already down!`);
			return;
		}

		actor.spendMp(skill.costMp);
		this.addLog(`${actor.name} uses ${skill.name}!`);

		for (const effect of skill.effects) {
			for (const target of alive) {
				effect.apply(actor, target, msg => {
					this.addLog(msg);
				});
			}
		}
	}

	/** Returns 'victory', 'defeat', or null if the fight is still ongoing. */
	checkVictory(): 'victory' | 'defeat' | undefined {
		if (this.aliveEnemies.length === 0) return 'victory';
		if (this.alivePlayers.length === 0) return 'defeat';
		return undefined;
	}

	/** Move to the next living combatant in the queue; start a new round if needed. */
	advanceTurn(): void {
		this.currentActorIndex++;
		// Skip combatants that died during this round.
		while (
			this.currentActorIndex < this.turnQueue.length &&
			!this.turnQueue[this.currentActorIndex]?.canAct()
		) {
			this.currentActorIndex++;
		}

		if (this.currentActorIndex >= this.turnQueue.length) {
			this.endRound();
		}
	}

	private endRound(): void {
		for (const c of this.allCombatants) {
			c.tickModifiers();
		}

		this.round++;
		this.addLog(`--- Round ${this.round} ---`);
		this.buildTurnQueue();
	}

	/** Must be called once before the first turn. */
	start(): void {
		this.addLog(`--- Round ${this.round} ---`);
		this.buildTurnQueue();
	}
}
