export type UIPhase =
	| 'init'
	| 'player_skill'
	| 'player_target'
	| 'enemy_auto'
	| 'victory'
	| 'defeat';

export type UIState = {
	phase: UIPhase;
	skillIndex: number;
	targetIndex: number;
	/** Incremented each turn so the enemy-auto effect re-fires even if phase stays 'enemy_auto'. */
	turnKey: number;
};
