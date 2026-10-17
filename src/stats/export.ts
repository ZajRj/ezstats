import type { Step, TestResult } from './types';
import { fix, fmt, fmtP } from './core/rounding';

function stepToText(step: Step): string {
  const title = step.title ? `### ${step.title}\n` : '';
  if (step.kind === 'text') return `${title}${step.body}`;
  if (step.kind === 'formula') {
    return `${title}${[step.expression, step.substituted, step.result].filter(Boolean).join('\n')}`;
  }
  const header = `| ${step.columns.join(' | ')} |`;
  const sep = `| ${step.columns.map(() => '---').join(' | ')} |`;
  const rows = step.rows.map((r) => `| ${r.join(' | ')} |`);
  return `${title}${[header, sep, ...rows].join('\n')}`;
}

/** Plain-text / Markdown version of a result, for pasting into notes. */
export function resultToText(r: TestResult): string {
  const lines = [
    `## ${r.testName}`,
    `α = ${fmt(r.alpha)} · modo ${r.mode}`,
    '',
    `H₀: ${r.hypotheses.h0}`,
    `H₁: ${r.hypotheses.h1}`,
    `${r.statistic.symbol} = ${fmt(r.statistic.value)}`,
  ];
  if (r.criticalLower && r.criticalValue) {
    lines.push(`Valores críticos: ${fmt(r.criticalLower.value)} y ${fmt(r.criticalValue.value)} (${r.criticalValue.source})`);
  } else if (r.criticalValue) {
    lines.push(`Valor crítico: ${fix(r.criticalValue.value, 4)} (${r.criticalValue.source})`);
  }
  if (r.pValue !== undefined) lines.push(`p${r.pValueApprox ? ' (aprox.)' : ''} = ${fmtP(r.pValue)}`);
  lines.push('', `**${r.decision === 'reject' ? 'Se rechaza H₀' : 'No se rechaza H₀'}.** ${r.conclusion}`);
  if (r.warnings.length) lines.push('', ...r.warnings.map((w) => `⚠ ${w}`));
  lines.push('', '---', '', ...r.steps.map(stepToText).flatMap((s) => [s, '']));
  for (const f of r.followUp ?? []) lines.push(resultToText(f));
  return lines.join('\n');
}
