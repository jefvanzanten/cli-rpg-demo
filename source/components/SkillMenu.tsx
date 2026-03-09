import React from 'react';
import {Combatant} from '../models/combatant.js';
import {Box, Text} from 'ink';

function SkillMenu({
	actor,
	selectedIndex,
}: {
	actor: Combatant;
	selectedIndex: number;
}) {
	return (
		/*──────────────────────────────────────────────────────────────────────┐ 
        │ Wizard's turn — choose a skill:                                       │ 
        │ ▶ Fireball       [10MP]  Magic damage to one enemy                    │ 
        │   Arcane Blast   [20MP]  Magic damage to ALL enemies                   │ 
        │   Heal           [15MP]  Restore own HP                                │ 
        └────────────────────────────────────────────────────────────────────────┘ 
        */
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

export default SkillMenu;
