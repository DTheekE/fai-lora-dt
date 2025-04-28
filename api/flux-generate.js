import { fal } from "@fal-ai/client"

fal.config({ credentials: process.env.FAL_KEY })

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  try {
    const payload = req.body

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: payload,
      logs: false, // You can turn logs true for debugging if needed
    })

    return res.status(200).json({ images: result?.data?.images || [] })
  } catch (err) {
    console.error("[Server] Fal API Error:", err)
    return res.status(500).json({ error: err.message || "Internal Server Error" })
  }
}
