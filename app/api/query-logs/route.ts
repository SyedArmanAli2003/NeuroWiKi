import { db } from '@/lib/db'

export async function GET() {
  const logs = db.prepare(`
    SELECT * FROM query_logs 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all()
  
  const stats = db.prepare(`
    SELECT 
      recall_strategy,
      COUNT(*) as count,
      AVG(pages_used) as avg_pages
    FROM query_logs
    GROUP BY recall_strategy
  `).all()
  
  return Response.json({ logs, stats })
}
