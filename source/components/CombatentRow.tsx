import React from 'react';
import {Combatant} from '../models/combatant.js';
import {Box, Text} from 'ink';
import {bar, pad} from '../helper.js';

export function CombatantRow({
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
