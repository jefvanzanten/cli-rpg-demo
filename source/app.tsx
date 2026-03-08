import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Combatant} from './models/combatant.js';
import {createDemo} from './models/data.js';
import {Battle} from './models/battle.js';
import {BattleAction} from './models/skill.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type UIPhase =
	| 'init'
	| 'player_skill'
	| 'player_target'
	| 'enemy_auto'
	| 'victory'
	| 'defeat';

type UIState = {
	phase: UIPhase;
	skillIndex: number;
	targetIndex: number;
	/** Incremented each turn so the enemy-auto effect re-fires even if phase stays 'enemy_auto'. */
	turnKey: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function bar(current: number, max: number, width = 8): string {
	const ratio = max === 0 ? 0 : current / max;
	const filled = Math.round(ratio * width);
	return (
		'█'.repeat(Math.max(0, filled)) + '░'.repeat(width - Math.max(0, filled))
	);
}

function pad(n: number, w: number): string {
	return String(n).padStart(w, ' ');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CombatantRow({
	c,
	isActive,
	isSelected,
}: {
	c: Combatant;
	isActive: boolean;
	isSelected: boolean;
}) {
	const {hp, mp, maxHp, maxMp} = c.resources;
	const alive = c.canAct();
	const nameColor = !alive
		? 'gray'
		: isSelected
		? 'yellow'
		: isActive
		? 'cyan'
		: 'white';
	const hpColor =
		hp < maxHp * 0.3 ? 'red' : hp < maxHp * 0.6 ? 'yellow' : 'green';
	const prefix = isSelected ? '▶ ' : isActive ? '→ ' : '  ';

	return (
		<Box>
			<Text color={nameColor}>
				{prefix}
				{c.name.padEnd(10)}
				{' HP '}
			</Text>
			<Text color={alive ? hpColor : 'gray'}>
				{bar(hp, maxHp)}
				{` ${pad(hp, 3)}/${maxHp}`}
			</Text>
			{maxMp > 0 && (
				<Text color={alive ? 'blue' : 'gray'}>
					{'  MP '}
					{bar(mp, maxMp, 5)}
					{` ${pad(mp, 2)}/${maxMp}`}
				</Text>
			)}
			{!alive && <Text color="gray"> [KO]</Text>}
		</Box>
	);
}

function SkillMenu({
	actor,
	selectedIndex,
}: {
	actor: Combatant;
	selectedIndex: number;
}) {
	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="cyan"
			paddingX={1}
		>
			<Text bold color="cyan">
				{actor.name}&apos;s turn — choose a skill:
			</Text>
			{actor.skills.map((skill, i) => {
				const canUse = skill.canUse(actor);
				const sel = i === selectedIndex;
				const mpText = skill.costMp > 0 ? ` [${skill.costMp}MP]` : '      ';
				return (
					<Text key={skill.id} color={sel ? 'cyan' : canUse ? 'white' : 'gray'}>
						{sel ? '▶ ' : '  '}
						{skill.name.padEnd(14)}
						{mpText}
						{'  '}
						{skill.description}
						{!canUse ? ' (not enough MP)' : ''}
					</Text>
				);
			})}
		</Box>
	);
}

function TargetMenu({
	targets,
	selectedIndex,
	skillName,
}: {
	targets: Combatant[];
	selectedIndex: number;
	skillName: string;
}) {
	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="yellow"
			paddingX={1}
		>
			<Text bold color="yellow">
				Target for {skillName}: (Esc to go back)
			</Text>
			{targets.map((t, i) => (
				<Text key={t.id} color={i === selectedIndex ? 'yellow' : 'white'}>
					{i === selectedIndex ? '▶ ' : '  '}
					{t.name.padEnd(10)}
					{`  HP ${pad(t.resources.hp, 3)}/${t.resources.maxHp}`}
				</Text>
			))}
		</Box>
	);
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
	// Battle and AI map are created once.
	const [{battle, aiMap}] = useState(() => {
		const demo = createDemo();
		return {
			battle: new Battle(demo.playerParty, demo.enemyParty),
			aiMap: demo.aiMap,
		};
	});

	const [ui, setUi] = useState<UIState>({
		phase: 'init',
		skillIndex: 0,
		targetIndex: 0,
		turnKey: 0,
	});

	// ── Init ───────────────────────────────────────────────────────────────────

	useEffect(() => {
		battle.start();
		const actor = battle.currentActor;
		setUi(prev => ({
			...prev,
			phase: actor?.isPlayer ? 'player_skill' : 'enemy_auto',
		}));
	}, [battle]);

	// ── Enemy auto-turn ────────────────────────────────────────────────────────
	// turnKey is incremented each time we enter a (possibly repeated) enemy turn
	// so this effect always re-fires for consecutive enemy turns.

	useEffect(() => {
		if (ui.phase !== 'enemy_auto') return;
		const actor = battle.currentActor;
		if (!actor) return;

		const timer = setTimeout(() => {
			const ai = aiMap.get(actor.id);
			if (ai) {
				const action = ai.chooseAction(battle, actor);
				if (action) {
					battle.executeAction(action);
				} else {
					battle.addLog(`${actor.name} does nothing.`);
				}
			} else {
				battle.addLog(`${actor.name} does nothing.`);
			}

			const result = battle.checkVictory();
			if (result) {
				setUi(prev => ({...prev, phase: result}));
				return;
			}

			battle.advanceTurn();
			const next = battle.currentActor;
			setUi(prev => ({
				...prev,
				phase: next?.isPlayer ? 'player_skill' : 'enemy_auto',
				skillIndex: 0,
				targetIndex: 0,
				turnKey: prev.turnKey + 1,
			}));
		}, 700);

		return () => {
			clearTimeout(timer);
		};
	}, [ui.phase, ui.turnKey, battle, aiMap]);

	// ── Player input ───────────────────────────────────────────────────────────

	function executePlayerAction(action: BattleAction) {
		battle.executeAction(action);
		const result = battle.checkVictory();
		if (result) {
			setUi(prev => ({...prev, phase: result}));
			return;
		}

		battle.advanceTurn();
		const next = battle.currentActor;
		setUi(prev => ({
			...prev,
			phase: next?.isPlayer ? 'player_skill' : 'enemy_auto',
			skillIndex: 0,
			targetIndex: 0,
			turnKey: prev.turnKey + 1,
		}));
	}

	useInput((input, key) => {
		const actor = battle.currentActor;
		if (!actor) return;

		if (ui.phase === 'player_skill') {
			const skills = actor.skills;
			if (key.upArrow) {
				setUi(prev => ({
					...prev,
					skillIndex: Math.max(0, prev.skillIndex - 1),
				}));
			} else if (key.downArrow) {
				setUi(prev => ({
					...prev,
					skillIndex: Math.min(skills.length - 1, prev.skillIndex + 1),
				}));
			} else if (key.return || input === ' ') {
				const skill = skills[ui.skillIndex];
				if (!skill || !skill.canUse(actor)) return;

				if (skill.targetRule.type === 'all-enemies') {
					executePlayerAction(skill.createAction(actor, battle.aliveEnemies));
				} else if (skill.targetRule.type === 'self') {
					executePlayerAction(skill.createAction(actor, [actor]));
				} else {
					setUi(prev => ({...prev, phase: 'player_target', targetIndex: 0}));
				}
			}
		} else if (ui.phase === 'player_target') {
			const skill = actor.skills[ui.skillIndex];
			if (!skill) return;
			const targets =
				skill.targetRule.type === 'single-ally'
					? battle.alivePlayers
					: battle.aliveEnemies;

			if (key.upArrow) {
				setUi(prev => ({
					...prev,
					targetIndex: Math.max(0, prev.targetIndex - 1),
				}));
			} else if (key.downArrow) {
				setUi(prev => ({
					...prev,
					targetIndex: Math.min(targets.length - 1, prev.targetIndex + 1),
				}));
			} else if (key.escape) {
				setUi(prev => ({...prev, phase: 'player_skill'}));
			} else if (key.return || input === ' ') {
				const target = targets[ui.targetIndex];
				if (!target) return;
				executePlayerAction(skill.createAction(actor, [target]));
			}
		}
	});

	// ── Render ─────────────────────────────────────────────────────────────────

	const actor = battle.currentActor;
	const logLines = battle.log.slice(-6);
	const currentSkill =
		actor && (ui.phase === 'player_target' || ui.phase === 'player_skill')
			? actor.skills[ui.skillIndex]
			: undefined;
	const targetList =
		currentSkill?.targetRule.type === 'single-ally'
			? battle.alivePlayers
			: battle.aliveEnemies;

	return (
		<Box flexDirection="column" paddingX={1} paddingY={0}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="yellow">
					{'⚔  RPG BATTLE DEMO'}
				</Text>
				<Text color="gray">{'  Round ' + String(battle.round)}</Text>
			</Box>

			{/* Enemy section */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="red"
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color="red">
					ENEMIES
				</Text>
				{battle.enemyParty.members.map(c => (
					<CombatantRow
						key={c.id}
						c={c}
						isActive={c === actor && !c.isPlayer}
						isSelected={
							ui.phase === 'player_target' &&
							battle.aliveEnemies[ui.targetIndex] === c
						}
					/>
				))}
			</Box>

			{/* Battle log */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color="gray">
					BATTLE LOG
				</Text>
				{logLines.map(entry => (
					<Text key={entry.id} color="gray">
						{entry.message}
					</Text>
				))}
			</Box>

			{/* Player section */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="green"
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color="green">
					HEROES
				</Text>
				{battle.playerParty.members.map(c => (
					<CombatantRow
						key={c.id}
						c={c}
						isActive={c === actor && c.isPlayer}
						isSelected={false}
					/>
				))}
			</Box>

			{/* Action area */}
			{ui.phase === 'player_skill' && actor && (
				<SkillMenu actor={actor} selectedIndex={ui.skillIndex} />
			)}

			{ui.phase === 'player_target' && actor && currentSkill && (
				<TargetMenu
					targets={targetList}
					selectedIndex={ui.targetIndex}
					skillName={currentSkill.name}
				/>
			)}

			{ui.phase === 'enemy_auto' && (
				<Box paddingX={1}>
					<Text color="gray" dimColor>
						Enemy is acting...
					</Text>
				</Box>
			)}

			{ui.phase === 'victory' && (
				<Box paddingX={1}>
					<Text bold color="yellow">
						*** VICTORY! You defeated all enemies! ***
					</Text>
				</Box>
			)}

			{ui.phase === 'defeat' && (
				<Box paddingX={1}>
					<Text bold color="red">
						*** DEFEAT! Your party was wiped out... ***
					</Text>
				</Box>
			)}

			{/* Controls hint */}
			{(ui.phase === 'player_skill' || ui.phase === 'player_target') && (
				<Box marginTop={1} paddingX={1}>
					<Text dimColor>
						Up/Down: navigate Enter/Space: confirm Esc: back Ctrl+C: quit
					</Text>
				</Box>
			)}
		</Box>
	);
}
