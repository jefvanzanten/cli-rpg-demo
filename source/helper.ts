export function pad(n: number, w: number): string {
	return String(n).padStart(w, ' ');
}

export function bar(current: number, max: number, width = 8): string {
	const ratio = max === 0 ? 0 : current / max;
	const filled = Math.round(ratio * width);
	return (
		'█'.repeat(Math.max(0, filled)) + '░'.repeat(width - Math.max(0, filled))
	);
}
