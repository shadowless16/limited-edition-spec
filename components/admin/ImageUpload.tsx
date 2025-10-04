"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface UploadEntry {
  url: string
  publicId?: string
}

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  // track uploaded entries locally so we can delete by publicId
  const [entries, setEntries] = useState<UploadEntry[]>(images.map((url) => ({ url })))

  // keep entries and parent `images` in sync
  useEffect(() => {
    setEntries(images.map((url) => ({ url })))
  }, [images])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      // Ensure admin token is present for authenticated upload
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) {
        toast({
          title: "Sign in required",
          description: "You must be signed in as an admin to upload images",
          variant: "destructive",
        })
        setIsUploading(false)
        return
      }

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/admin/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err?.error || "Upload failed")
        }

        const data = await response.json()
        // return an UploadEntry so callers can track publicId for deletions
        return { url: data.url, publicId: data.publicId }
      })

      const newEntries = await Promise.all(uploadPromises)
      // merge entries (both are UploadEntry[])
      const merged = [...entries, ...newEntries]
      setEntries(merged)
      onImagesChange(merged.map((e) => e.url))

      toast({
        title: "Images uploaded",
        description: `${files.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = async (index: number) => {
    const entry = entries[index]
    // If we have a publicId, attempt to delete from Cloudinary
    if (entry?.publicId) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        await fetch("/api/admin/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ publicId: entry.publicId }),
        })
      } catch (e) {
        // ignore delete failures but show a toast
        toast({ title: "Warning", description: "Failed to delete remote image", variant: "destructive" })
      }
    }

    const newEntries = entries.filter((_, i) => i !== index)
    setEntries(newEntries)
    onImagesChange(newEntries.map((e) => e.url))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <Card key={index} className="relative group">
            <CardContent className="p-2">
              <div className="aspect-square relative rounded-md overflow-hidden">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {images.length < maxImages && (
          <Card className="border-dashed">
            <CardContent className="p-2">
              <div className="aspect-square flex items-center justify-center">
                <Button
                  variant="ghost"
                  className="h-full w-full flex-col gap-2"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">Upload Image</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />

      <p className="text-sm text-muted-foreground">Upload up to {maxImages} images. Recommended size: 800x800px</p>
    </div>
  )
}
