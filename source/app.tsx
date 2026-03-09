import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {createDemo} from './models/data.js';
import {Battle} from './models/battle.js';
import {BattleAction} from './models/skill.js';
import {UIState} from './types.js';
import {CombatantRow} from './components/CombatentRow.js';
import SkillMenu from './components/SkillMenu.js';
import TargetMenu from './components/TargetMenu.js';

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

	useEffect(() => {
		battle.start();
		const actor = battle.currentActor;
		setUi(prev => ({
			...prev,
			phase: actor?.isPlayer ? 'player_skill' : 'enemy_auto',
		}));
	}, [battle]);

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
