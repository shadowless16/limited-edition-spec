"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input as UIInput } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Users, ShoppingCart, TrendingUp, Edit, Trash2 } from "lucide-react"
import OrderManagement from "@/components/OrderManagement"
import { formatPrice } from "@/lib/pricing"
import CreateProductModal from "@/components/admin/CreateProductModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface Product {
  _id: string
  name: string
  currentPhase: "waitlist" | "originals" | "echo"
  status: "active" | "paused" | "ended"
  variants: Array<{
    color: string
    material: string
    stock: number
    reserved: number
  }>
  waitlistCount: number
  totalSold: number
  basePrice: number
  images: string[]
  sku: string // Add the 'sku' property
  paymentOptions?: string[]
}

interface WaitlistEntry {
  _id: string
  productId: string
  email: string
  position: number
  status: "active" | "notified" | "converted"
  createdAt: string
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Client-side guard: ensure current user is admin, otherwise redirect to homepage
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsAdmin(false)
        return
      }
      try {
        const resp = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        if (!resp.ok) {
          setIsAdmin(false)
          return
        }
        const data = await resp.json()
        setIsAdmin(!!data.role && data.role === "admin")
      } catch (e) {
        setIsAdmin(false)
      }
    }
    check()
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, waitlistRes] = await Promise.all([fetch("/api/admin/products"), fetch("/api/admin/waitlist")])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.map((product: any) => ({
          ...product,
          sku: product.sku || "", // Ensure 'sku' is included
        })))
      }

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json()
        setWaitlistEntries(waitlistData)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProductPhase = async (productId: string, newPhase: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: newPhase }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error updating product phase:", error)
    }
  }

  const deleteProduct = async (productId: string) => {
    // kept for backward compatibility; callers now use ConfirmDelete below
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "waitlist":
        return "bg-blue-500"
      case "originals":
        return "bg-emerald-500"
      case "echo":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalProducts = products.length
  const totalWaitlist = waitlistEntries.length
  const totalSales = products.reduce((sum, p) => sum + p.totalSold, 0)
  const activeProducts = products.filter((p) => p.status === "active").length

  

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <CreateProductModal onProductCreated={fetchData} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">{activeProducts} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waitlist Entries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWaitlist}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-muted-foreground">Units sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalWaitlist > 0 ? Math.round((totalSales / totalWaitlist) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Waitlist to sale</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4">
              {products.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first limited edition product to get started.
                    </p>
                    <CreateProductModal onProductCreated={fetchData} />
                  </CardContent>
                </Card>
              ) : (
                products.map((product) => (
                  <Card key={product._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{formatPrice(product.basePrice)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPhaseColor(product.currentPhase)}>{product.currentPhase}</Badge>
                          <Badge variant={product.status === "active" ? "default" : "secondary"}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Waitlist</p>
                          <p className="text-2xl font-bold">{product.waitlistCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Sold</p>
                          <p className="text-2xl font-bold">{product.totalSold || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Variants</p>
                          <p className="text-2xl font-bold">{product.variants?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Stock</p>
                          <p className="text-2xl font-bold">
                            {product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}
                          </p>
                        </div>
                      </div>

                      {/* Payment options visibility: show badges so admins can see configured methods */}
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Payment Options</p>
                        <div className="flex items-center gap-2 mt-2">
                          {product.paymentOptions && product.paymentOptions.length > 0 ? (
                            product.paymentOptions.map((opt: string) => (
                              <Badge key={opt} className="capitalize">{opt.replace("_", " ")}</Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">None configured</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {product.currentPhase === "waitlist" && (
                          <Button size="sm" onClick={() => updateProductPhase(product._id, "originals")}>
                            Launch Originals
                          </Button>
                        )}
                        {product.currentPhase === "originals" && (
                          <Button size="sm" onClick={() => updateProductPhase(product._id, "echo")}>
                            Open Echo Phase
                          </Button>
                        )}
                        <CreateProductModal
                          product={product}
                          onProductUpdated={() => fetchData()}
                        >
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </Button>
                        </CreateProductModal>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>Are you sure you want to delete the product "{product.name}"? This action cannot be undone.</p>
                              <div className="flex justify-end gap-2 mt-4">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    className="text-destructive"
                                    onClick={async () => {
                                      await deleteProduct(product._id)
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </DialogClose>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Waitlist Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {waitlistEntries.slice(0, 10).map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{entry.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Position #{entry.position} • {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={entry.status === "active" ? "default" : "secondary"}>{entry.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodsManager />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>
          {/* Payment mapping removed — payment methods are global-only */}
        </Tabs>
      </div>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name?: string; isAdmin: boolean }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) return
      const data = await resp.json()
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      })
      if (resp.ok) fetchUsers()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div>Loading users...</div>

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between p-3 border rounded">
          <div>
            <div className="font-medium">{u.name || u.email}</div>
            <div className="text-sm text-muted-foreground">{u.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm">{u.isAdmin ? "Admin" : "User"}</div>
            <Button size="sm" onClick={() => toggleAdmin(u.id, !u.isAdmin)}>{u.isAdmin ? "Revoke Admin" : "Make Admin"}</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PaymentMethodsManager() {
  const [methods, setMethods] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    key: "",
    methodType: "bank", // bank | crypto | other
    name: "",
    enabled: true,
    // bank fields
    bankName: "",
    accountNumber: "",
    accountName: "",
    routingNumber: "",
    // crypto fields
    cryptoAddress: "",
    cryptoNetwork: "",
    cryptoNotes: "",
    // generic fallback
    genericDetails: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch("/api/admin/payment-methods", { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) return
      const data = await resp.json()
      setMethods(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const create = async () => {
    try {
      const token = localStorage.getItem("token")
      const details: any = {}
      if (form.methodType === 'bank') {
        if (form.bankName) details.bankName = form.bankName
        if (form.accountNumber) details.accountNumber = form.accountNumber
        if (form.accountName) details.accountName = form.accountName
        if (form.routingNumber) details.routingNumber = form.routingNumber
      } else if (form.methodType === 'crypto') {
        if (form.cryptoAddress) details.cryptoAddress = form.cryptoAddress
        if (form.cryptoNetwork) details.cryptoNetwork = form.cryptoNetwork
        if (form.cryptoNotes) details.cryptoNotes = form.cryptoNotes
      } else if (form.methodType === 'other' && form.genericDetails) {
        try {
          const parsed = JSON.parse(form.genericDetails)
          Object.assign(details, parsed)
        } catch (e) {
          details.note = form.genericDetails
        }
      }

      const keyToUse = form.key || (form.methodType === 'bank' ? 'bank_transfer' : form.methodType === 'crypto' ? 'crypto' : '')

      const payload: any = {
        key: keyToUse,
        name: form.name,
        enabled: form.enabled,
      }
      if (Object.keys(details).length) payload.details = details

      let resp
      if (editingId) {
        resp = await fetch(`/api/admin/payment-methods/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
        setEditingId(null)
      } else {
        resp = await fetch("/api/admin/payment-methods", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      }
    if (resp.ok) {
  setForm({ key: "", methodType: 'bank', name: "", enabled: true, bankName: "", accountNumber: "", accountName: "", routingNumber: "", cryptoAddress: "", cryptoNetwork: "", cryptoNotes: "", genericDetails: "" })
        fetchMethods()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const remove = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (resp.ok) fetchMethods()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div>Loading payment methods...</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select className="w-full p-2 rounded border" value={form.methodType} onChange={(e) => {
            const t = e.target.value
            // when switching type, suggest a default key
            const suggestedKey = t === 'bank' ? 'bank_transfer' : t === 'crypto' ? 'crypto' : ''
            setForm({ ...form, methodType: t, key: suggestedKey })
          }}>
            <option value="bank">Bank Transfer</option>
            <option value="crypto">Crypto / Wallet</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Key</label>
          <UIInput placeholder="key (e.g. bank_transfer)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Display name</label>
          <UIInput placeholder="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={create}>{editingId ? 'Save' : 'Create'}</Button>
          {editingId && (
            <Button variant="outline" onClick={() => { setEditingId(null); setForm({ key: '', methodType: 'bank', name: '', enabled: true, bankName: '', accountNumber: '', accountName: '', routingNumber: '', cryptoAddress: '', cryptoNetwork: '', cryptoNotes: '', genericDetails: '' }) }}>Cancel</Button>
          )}
        </div>
      </div>

      {/* Structured Details Form: show fields depending on selected type. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {form.methodType === 'bank' && (
          <div>
            <p className="text-sm font-medium mb-2">Bank Transfer Details</p>
            <UIInput placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="mb-2" />
            <UIInput placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="mb-2" />
            <UIInput placeholder="Account name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className="mb-2" />
            <UIInput placeholder="Routing / Sort code (optional)" value={form.routingNumber} onChange={(e) => setForm({ ...form, routingNumber: e.target.value })} />
          </div>
        )}

        {form.methodType === 'crypto' && (
          <div>
            <p className="text-sm font-medium mb-2">Crypto Details</p>
            <UIInput placeholder="Wallet address" value={form.cryptoAddress} onChange={(e) => setForm({ ...form, cryptoAddress: e.target.value })} className="mb-2" />
            <UIInput placeholder="Network (e.g. ethereum, bitcoin)" value={form.cryptoNetwork} onChange={(e) => setForm({ ...form, cryptoNetwork: e.target.value })} className="mb-2" />
            <UIInput placeholder="Notes / memo (optional)" value={form.cryptoNotes} onChange={(e) => setForm({ ...form, cryptoNotes: e.target.value })} />
          </div>
        )}

        {form.methodType === 'other' && (
          <div>
            <p className="text-sm font-medium mb-2">Other / Fallback details</p>
            <UIInput placeholder="Short description or instructions" value={form.genericDetails} onChange={(e) => setForm({ ...form, genericDetails: e.target.value })} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {methods.length === 0 && <div>No payment methods configured</div>}
        {methods.map((m) => (
          <div key={m._id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{m.name} <span className="text-xs text-muted-foreground">({m.key})</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                // prefill form for edit
                const d = m.details || {}
                // detect type
                let detectedType = 'other'
                if (d.bankName || d.accountNumber || d.account_number || d.account_name) detectedType = 'bank'
                else if (d.cryptoAddress || d.address || d.cryptoNetwork || d.network) detectedType = 'crypto'

                setForm({
                  key: m.key,
                  methodType: detectedType,
                  name: m.name,
                  enabled: !!m.enabled,
                  bankName: d.bankName || d.bank || "",
                  accountNumber: d.accountNumber || d.account_number || "",
                  accountName: d.accountName || d.account_name || "",
                  routingNumber: d.routingNumber || d.routing_number || "",
                  cryptoAddress: d.cryptoAddress || d.address || "",
                  cryptoNetwork: d.cryptoNetwork || d.network || "",
                  cryptoNotes: d.cryptoNotes || d.notes || "",
                  genericDetails: detectedType === 'other' && typeof d === 'object' && Object.keys(d).length ? JSON.stringify(d) : "",
                })
                setEditingId(m._id)
              }}>Edit</Button>
              <Button variant="outline" size="sm" onClick={() => remove(m._id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsPanel() {
  const [whatsappNumber, setWhatsappNumber] = useState<string>('')
  const [brandColor, setBrandColor] = useState<string>('#6b3d2e')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        const resp = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
        if (!resp.ok) return
        const data = await resp.json()
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber)
        if (data.brandColor) setBrandColor(data.brandColor)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ whatsappNumber, brandColor }),
      })
      if (!resp.ok) throw new Error('Failed to save')
      alert('Settings saved')
    } catch (e) {
      console.error(e)
      alert('Failed to save settings')
    }
  }

  if (loading) return <div>Loading settings...</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">WhatsApp Number (E.164)</label>
          <UIInput value={whatsappNumber} onChange={(e) => setWhatsappNumber((e.target as HTMLInputElement).value)} placeholder="+15551234567" />
        </div>
        <div>
          <label className="text-sm">Brand Color (hex)</label>
          <UIInput value={brandColor} onChange={(e) => setBrandColor((e.target as HTMLInputElement).value)} placeholder="#6b3d2e" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  )
}

function PaymentMethodMapper() {
  const [products, setProducts] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        const [pRes, mRes] = await Promise.all([
          fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/payment-methods', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (pRes.ok) setProducts(await pRes.json())
        if (mRes.ok) setMethods(await mRes.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const saveMapping = async (productId: string, selected: string[]) => {
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`/api/admin/products/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ paymentOptions: selected }) })
      if (resp.ok) {
        setProducts((p) => p.map(pr => pr._id === productId ? { ...pr, paymentOptions: selected } : pr))
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div>Loading mappings...</div>

  return (
    <div className="space-y-4">
      {products.map((p) => (
        <div key={p._id} className="p-3 border rounded grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="font-medium">{p.name}</div>
          <div>
            <select multiple value={p.paymentOptions || []} onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map(o => o.value)
              // local optimistic update
              setProducts((ps) => ps.map(x => x._id === p._id ? { ...x, paymentOptions: opts } : x))
            }} className="w-full">
              {methods.map((m) => (
                <option key={m._id} value={m.key}>{m.name} ({m.key})</option>
              ))}
            </select>
          </div>
          <div>
            <Button onClick={() => saveMapping(p._id, p.paymentOptions || [])}>Save</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

