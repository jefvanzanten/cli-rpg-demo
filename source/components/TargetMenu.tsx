import React from 'react';
import {Combatant} from '../models/combatant.js';
import {Box, Text} from 'ink';
import {pad} from '../helper.js';

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

export default TargetMenu;
