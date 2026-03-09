export interface CodeAnalysis {
	bigO: string;
	timeComplexity: string;
	spaceComplexity: string;
	patterns: string[];
	suggestions: string[];
	visualization: string;
}

export function analyzeCode(code: string): CodeAnalysis {
	const patterns: string[] = [];
	const suggestions: string[] = [];
	let timeComplexity = 'O(1)';
	let spaceComplexity = 'O(1)';
	let visualization = '';

	// Normalize code
	const normalized = code.toLowerCase();

	// Detect nested loops (O(n²), O(n³), etc.) - improved detection
	const forLoops = (code.match(/\bfor\s*\(/gi) || []).length;
	const whileLoops = (code.match(/\bwhile\s*\(/gi) || []).length;
	const doWhileLoops = (code.match(/\bdo\b/gi) || []).length;
	const totalLoops = forLoops + whileLoops + doWhileLoops;

	if (totalLoops > 0) {
		patterns.push(`Found ${totalLoops} loop(s)`);
		if (totalLoops === 1) {
			timeComplexity = 'O(n)';
			patterns.push('Single loop - Linear time');
		} else if (totalLoops === 2) {
			timeComplexity = 'O(n²)';
			patterns.push('Nested loops - Quadratic time');
			suggestions.push('Consider using a hash map or set to avoid nested loops');
		} else if (totalLoops >= 3) {
			timeComplexity = `O(n${totalLoops})`;
			patterns.push(`${totalLoops} nested loops - Polynomial time`);
			suggestions.push('Multiple nested loops detected - consider divide & conquer or dynamic programming');
		}
	}

	// Detect recursion
	if (normalized.includes('return') && code.includes('(')) {
		const funcNameMatch = code.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
		if (funcNameMatch) {
			const funcName = funcNameMatch[1] || funcNameMatch[2];
			if (code.includes(funcName + '(')) {
				patterns.push('Recursive call detected');
				if (!normalized.includes('memo') && !normalized.includes('cache')) {
					suggestions.push('Add memoization to cache results and avoid redundant calculations');
					timeComplexity = 'O(2^n) - Consider memoization for O(n)';
				} else {
					patterns.push('Memoization detected');
					timeComplexity = 'O(n) - With memoization';
				}
			}
		}
	}

	// Detect sort operations
	if (normalized.includes('sort')) {
		patterns.push('Sort operation detected');
		timeComplexity = 'O(n log n)';
		spaceComplexity = 'O(log n) to O(n)';
	}

	// Detect array/object operations
	if (normalized.includes('.filter') || normalized.includes('.map') || normalized.includes('.reduce')) {
		patterns.push('Higher-order functions detected');
		if (timeComplexity === 'O(1)') {
			timeComplexity = 'O(n)';
		}
	}

	// Detect binary search
	if (normalized.includes('binary') || (normalized.includes('left') && normalized.includes('right') && normalized.includes('mid'))) {
		patterns.push('Binary search detected');
		timeComplexity = 'O(log n)';
		visualization = 'Binary search: Dividing search space in half each iteration';
	}

	// Space complexity detection
	if (normalized.includes('new array') || normalized.includes('[]') || normalized.includes('{}')) {
		const declarations = (code.match(/new\s+Array|new\s+Object|\[\s*\]|\{\s*\}/g) || []).length;
		if (declarations > 1) {
			spaceComplexity = 'O(n)';
			suggestions.push('Multiple data structures allocated - high space complexity');
		}
	}

	// Generate visualization
	if (visualization === '') {
		if (totalLoops > 0) {
			visualization = `Loop execution: Iterates through input ${totalLoops === 1 ? 'once' : `${totalLoops} times nested`}`;
		} else if (patterns.some(p => p.includes('Recursive'))) {
			visualization = 'Recursive call tree - Each call branches into sub-calls';
		} else if (patterns.some(p => p.includes('Binary'))) {
			visualization = 'Binary tree traversal - Logarithmic depth';
		} else {
			visualization = 'Linear execution through function body';
		}
	}

	// Add general suggestions
	if (suggestions.length === 0) {
		if (timeComplexity.includes('n²')) {
			suggestions.push('Try using a hash table or set for O(1) lookups instead of nested loops');
		} else if (timeComplexity.includes('2^n')) {
			suggestions.push('Use memoization or dynamic programming to improve performance');
		}
	}

	return {
		bigO: timeComplexity,
		timeComplexity,
		spaceComplexity,
		patterns,
		suggestions,
		visualization
	};
}

export function generateOptimizationCode(code: string): string {
	const analysis = analyzeCode(code);
	let optimized = code;

	// Suggest optimizations based on patterns
	if (analysis.bigO.includes('n²')) {
		optimized += '\n\n// Optimized version using Set/Map:\n';
		optimized += '// Replace nested loop with hash-based lookup for O(n) time complexity';
	}

	if (analysis.patterns.some(p => p.includes('Recursive'))) {
		optimized += '\n\n// Memoization Pattern:\n';
		optimized += 'const memo = {};\nfunction optimized(n) {\n  if (n in memo) return memo[n];\n  // ... your logic ...\n  memo[n] = result;\n  return result;\n}';
	}

	return optimized;
}
