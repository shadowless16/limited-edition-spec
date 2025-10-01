"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, Filter, Download, Mail, Users, Calendar, ChevronDown } from "lucide-react"

interface WaitlistEntry {
  _id: string
  productId: string
  productName?: string
  email: string
  position: number
  status: "active" | "notified" | "converted"
  createdAt: string
}

export default function WaitlistManagement() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<WaitlistEntry[]>([])
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [productFilter, setProductFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  
  // Bulk actions
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  
  const [products, setProducts] = useState<Array<{_id: string, name: string}>>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [entries, searchTerm, statusFilter, productFilter, dateFilter])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [waitlistRes, productsRes] = await Promise.all([
        fetch("/api/admin/waitlist", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json()
        setEntries(waitlistData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...entries]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(entry => entry.status === statusFilter)
    }

    // Product filter
    if (productFilter !== "all") {
      filtered = filtered.filter(entry => entry.productId === productFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      if (dateFilter !== "all") {
        filtered = filtered.filter(entry => new Date(entry.createdAt) >= filterDate)
      }
    }

    setFilteredEntries(filtered)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(new Set(filteredEntries.map(entry => entry._id)))
    } else {
      setSelectedEntries(new Set())
    }
  }

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    const newSelected = new Set(selectedEntries)
    if (checked) {
      newSelected.add(entryId)
    } else {
      newSelected.delete(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const exportSelected = () => {
    const selectedData = filteredEntries.filter(entry => selectedEntries.has(entry._id))
    const csvContent = [
      ["Email", "Product", "Position", "Status", "Join Date"],
      ...selectedData.map(entry => [
        entry.email,
        entry.productName || "Unknown",
        entry.position.toString(),
        entry.status,
        new Date(entry.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendBulkEmail = async () => {
    if (!emailSubject || !emailMessage || selectedEntries.size === 0) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/waitlist/bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntries),
          subject: emailSubject,
          message: emailMessage
        })
      })

      if (response.ok) {
        setBulkEmailOpen(false)
        setEmailSubject("")
        setEmailMessage("")
        setSelectedEntries(new Set())
        alert("Bulk email sent successfully!")
      }
    } catch (error) {
      console.error("Error sending bulk email:", error)
      alert("Failed to send bulk email")
    }
  }

  const updateBulkStatus = async (newStatus: string) => {
    if (selectedEntries.size === 0) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/waitlist/bulk-update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntries),
          status: newStatus
        })
      })

      if (response.ok) {
        fetchData()
        setSelectedEntries(new Set())
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  if (loading) {
    return <div className="p-4">Loading waitlist data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Waitlist Management</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredEntries.length} entries ({selectedEntries.size} selected)
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="notified">Notified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map(product => (
                <SelectItem key={product._id} value={product._id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedEntries.size > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium self-center">
              {selectedEntries.size} selected:
            </span>
            
            <Button size="sm" onClick={exportSelected}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Bulk Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Email message..."
                      rows={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBulkEmailOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={sendBulkEmail}>
                      Send to {selectedEntries.size} recipients
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Select onValueChange={updateBulkStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Mark Active</SelectItem>
                <SelectItem value="notified">Mark Notified</SelectItem>
                <SelectItem value="converted">Mark Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Entries Table */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <div className="grid grid-cols-12 gap-4 flex-1 text-sm font-medium">
                <div className="col-span-4">Email</div>
                <div className="col-span-2">Product</div>
                <div className="col-span-1">Position</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Join Date</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No waitlist entries found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry._id} className="p-3 border-b hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedEntries.has(entry._id)}
                      onCheckedChange={(checked) => handleSelectEntry(entry._id, checked as boolean)}
                    />
                    <div className="grid grid-cols-12 gap-4 flex-1 text-sm">
                      <div className="col-span-4 font-medium">{entry.email}</div>
                      <div className="col-span-2 text-muted-foreground">
                        {entry.productName || "Unknown"}
                      </div>
                      <div className="col-span-1">#{entry.position}</div>
                      <div className="col-span-2">
                        <Badge variant={
                          entry.status === "active" ? "default" :
                          entry.status === "notified" ? "secondary" : "outline"
                        }>
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-1">
                        <Button size="sm" variant="ghost">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {filteredEntries.filter(e => e.status === "active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {filteredEntries.filter(e => e.status === "notified").length}
            </div>
            <div className="text-sm text-muted-foreground">Notified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {filteredEntries.filter(e => e.status === "converted").length}
            </div>
            <div className="text-sm text-muted-foreground">Converted</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}