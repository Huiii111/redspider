const HEURISTIC_RULE = 'Tool with the most findings on TerraGoat'

const countStatus = (cases, toolId, status) =>
  cases.filter((faultCase) => faultCase.results[toolId] === status).length

function pickHeuristicTool(tools, terragoatFindings) {
  return tools.reduce((best, tool) =>
    terragoatFindings[tool.id] > terragoatFindings[best.id] ? tool : best,
  )
}

export function summarizeRun({ tools, cases, terragoatFindings }) {
  const pick = pickHeuristicTool(tools, terragoatFindings)
  const missed = cases.filter((faultCase) => faultCase.results[pick.id] === 'SILENT')
  const caughtByAnotherTool = missed.filter((faultCase) =>
    tools.some((tool) => tool.id !== pick.id && faultCase.results[tool.id] === 'DETECTED'),
  )

  return {
    heuristic: {
      rule: HEURISTIC_RULE,
      toolId: pick.id,
      missed: missed.length,
      caughtByAnotherTool: caughtByAnotherTool.length,
    },
    tools: tools.map((tool) => ({
      ...tool,
      terragoatFindings: terragoatFindings[tool.id],
      detected: countStatus(cases, tool.id, 'DETECTED'),
      silent: countStatus(cases, tool.id, 'SILENT'),
      error: countStatus(cases, tool.id, 'ERROR'),
    })),
  }
}
