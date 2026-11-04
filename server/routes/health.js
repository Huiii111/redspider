export const healthRoute = ({ health }) => (_request, response) => {
  response.json({ tools: health() })
}
