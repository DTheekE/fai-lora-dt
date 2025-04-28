import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Download, Plus, X } from "lucide-react"
import JSZip from "jszip"

export default function FluxStyleGUI() {
  const [prompt, setPrompt] = useState("")
  const [prompts, setPrompts] = useState([""])
  const [numSteps, setNumSteps] = useState(28)
  const [guidanceScale, setGuidanceScale] = useState(3.5)
  const [realCFGScale, setRealCFGScale] = useState(3.5)
  const [numImages, setNumImages] = useState(1)
  const [safetyChecker, setSafetyChecker] = useState(true)
  const [imageSize, setImageSize] = useState("portrait_16_9")
  const [loraPaths, setLoraPaths] = useState([""])
  const [allResults, setAllResults] = useState([])
  const [selectedLoraIndex, setSelectedLoraIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateForLora = async (loraPath, individualPrompt) => {
    const payload = {
      prompt: individualPrompt || prompt,
      num_inference_steps: Number(numSteps),
      guidance_scale: Number(guidanceScale),
      real_cfg_scale: Number(realCFGScale),
      num_images: Number(numImages),
      enable_safety_checker: safetyChecker,
      reference_strength: 0.65,
      reference_end: 1,
      base_shift: 0.5,
      max_shift: 1.15,
      image_size: imageSize,
      controlnets: [],
      controlnet_unions: [],
      ip_adapters: [],
      loras: loraPath ? [{ path: loraPath }] : [],
      scale: 1,
    }

    if (import.meta.env.DEV) {
      console.log("[DEV MODE] Returning mocked images")
      return ["https://dummyimage.com/512x512/000/fff&text=Mock+Image"]
    }

    const response = await fetch("/api/flux-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate images.")
    }

    const data = await response.json()
    return data.images || []
  }

  const handleGenerateAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const promises = loraPaths.map((path, index) => generateForLora(path, prompts[index]))
      const results = await Promise.all(promises)
      setAllResults(results)
    } catch (err) {
      console.error("API Error:", err)
      setError(err?.message || "An error occurred while generating the images.")
    } finally {
      setLoading(false)
    }
  }

  const downloadZip = async () => {
    const zip = new JSZip()
    const folder = zip.folder("generated_images")
    const selectedImages = allResults.flat()
    await Promise.all(
      selectedImages.map(async (url, index) => {
        const res = await fetch(url)
        const blob = await res.blob()
        folder.file(`image_${index + 1}.jpg`, blob)
      })
    )
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(zipBlob)
    link.download = "images.zip"
    link.click()
  }

  const addLoraInput = () => {
    setLoraPaths([...loraPaths, ""])
    setPrompts([...prompts, ""])
  }

  const removeLoraInput = (index) => {
    const newPaths = [...loraPaths]
    const newPrompts = [...prompts]
    newPaths.splice(index, 1)
    newPrompts.splice(index, 1)
    setLoraPaths(newPaths)
    setPrompts(newPrompts)
    if (selectedLoraIndex >= newPaths.length) {
      setSelectedLoraIndex(newPaths.length - 1)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-900 text-white">
      <div className="w-1/2 p-6 border-r border-zinc-800 space-y-4 overflow-y-auto">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Base Prompt (optional)</label>
          <Textarea
            className="bg-zinc-800 text-white border-zinc-700"
            placeholder="Describe your image prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {loraPaths.map((path, i) => (
          <div key={i} className="space-y-2 relative border border-zinc-700 p-3 rounded-md">
            <button onClick={() => removeLoraInput(i)} className="absolute top-2 right-2 text-zinc-400 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
            <label className="text-sm font-semibold">Lora Path {i + 1}</label>
            <Input
              className="bg-zinc-800 text-white border-zinc-700"
              placeholder={`Lora path ${i + 1}`}
              value={path}
              onChange={(e) => {
                const newPaths = [...loraPaths]
                newPaths[i] = e.target.value
                setLoraPaths(newPaths)
              }}
            />
            <Input
              className="bg-zinc-800 text-white border-zinc-700"
              placeholder={`Prompt for Lora ${i + 1} (optional)`}
              value={prompts[i] || ""}
              onChange={(e) => {
                const newPrompts = [...prompts]
                newPrompts[i] = e.target.value
                setPrompts(newPrompts)
              }}
            />
          </div>
        ))}

        <Button variant="outline" onClick={addLoraInput} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Lora
        </Button>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <label className="text-sm font-semibold">Num Inference Steps</label>
            <input type="range" min={1} max={100} value={numSteps} onChange={(e) => setNumSteps(e.target.value)} className="w-full" />
            <span className="text-xs">{numSteps}</span>
          </div>
          <div>
            <label className="text-sm font-semibold">Guidance Scale (CFG)</label>
            <input type="range" min={0} max={20} step={0.1} value={guidanceScale} onChange={(e) => setGuidanceScale(e.target.value)} className="w-full" />
            <span className="text-xs">{guidanceScale}</span>
          </div>
          <div>
            <label className="text-sm font-semibold">Real CFG Scale</label>
            <input type="range" min={0} max={20} step={0.1} value={realCFGScale} onChange={(e) => setRealCFGScale(e.target.value)} className="w-full" />
            <span className="text-xs">{realCFGScale}</span>
          </div>
          <div>
            <label className="text-sm font-semibold">Num Images</label>
            <input type="range" min={1} max={4} value={numImages} onChange={(e) => setNumImages(e.target.value)} className="w-full" />
            <span className="text-xs">{numImages}</span>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <label className="text-sm font-semibold">Image Size</label>
          <select
            className="bg-zinc-800 text-white border-zinc-700 w-full p-2 rounded-md"
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="square">Square</option>
            <option value="square_hd">Square HD</option>
            <option value="portrait_3_4">Portrait 3:4</option>
            <option value="portrait_16_9">Portrait 9:16</option>
            <option value="landscape_4_3">Landscape 4:3</option>
            <option value="landscape_16_9">Landscape 16:9</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleGenerateAll} disabled={loading} className="bg-purple-600">
            {loading ? <><Loader2 className="animate-spin mr-2" /> Generating...</> : "Generate All"}
          </Button>
          <Button onClick={downloadZip} disabled={allResults.flat().length === 0} className="bg-blue-500">Download All (Zip)</Button>
        </div>
      </div>

      <div className="w-1/2 p-6 overflow-y-auto">
        <Card className="bg-zinc-800">
          <CardContent className="p-4">
            <div className="mb-4 space-x-2">
              {loraPaths.map((_, i) => (
                <Button key={i} variant={selectedLoraIndex === i ? "default" : "outline"} onClick={() => setSelectedLoraIndex(i)}>
                  Lora {i + 1}
                </Button>
              ))}
            </div>
            {loading ? (
              <div className="text-center">
                <Loader2 className="animate-spin w-8 h-8 mx-auto" />
                <p>Generating...</p>
              </div>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : allResults[selectedLoraIndex]?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {allResults[selectedLoraIndex].map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} className="rounded-xl shadow-md" />
                    <a
                      href={url}
                      onClick={async (e) => {
                        e.preventDefault();
                        const res = await fetch(url);
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `image_${selectedLoraIndex + 1}_${index + 1}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                      }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-1 rounded"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center">No result yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
