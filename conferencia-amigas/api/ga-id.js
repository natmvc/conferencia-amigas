export default function handler(request, response) {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;

  if (!measurementId) {
    response.status(204).end();
    return;
  }

  response.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  response.status(200).json({ measurementId });
}
