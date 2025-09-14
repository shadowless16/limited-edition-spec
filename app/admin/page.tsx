"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/Header"
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
import BankTransferForm from "@/components/payment/BankTransferForm"
import CryptoPaymentForm from "@/components/payment/CryptoPaymentForm"

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
  sku: string
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
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }
      const [productsRes, waitlistRes] = await Promise.all([
        fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/waitlist", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.map((product: any) => ({
          ...product,
          sku: product.sku || "",
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
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/products/${productId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ phase: newPhase }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error updating product phase:", error)
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })

      if (response.ok) {
        fetchData()
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-4">
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <CreateProductModal onProductCreated={fetchData} />
        </div>

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
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(product.basePrice)}
                            </p>
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
                  {waitlistEntries.slice(0, 50).map((entry) => (
                    <Dialog key={entry._id}>
                      <DialogTrigger asChild>
                        <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{entry.email}</p>
                                <p className="text-sm text-muted-foreground">Position #{entry.position} • {new Date(entry.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Badge variant={entry.status === "active" ? "default" : "secondary"}>{entry.status}</Badge>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Waitlist Entry Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div><strong>Email:</strong> {entry.email}</div>
                          <div><strong>Position:</strong> #{entry.position}</div>
                          <div><strong>Status:</strong> {entry.status}</div>
                          <div><strong>Joined:</strong> {new Date(entry.createdAt).toLocaleDateString()}</div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
            <PaymentMethodsManager />
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
        </Tabs>
      </div>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name?: string; isAdmin: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAll, setShowAll] = useState(false)

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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  const displayUsers = showAll ? filteredUsers : filteredUsers.slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <UIInput 
          placeholder="Search users..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {!showAll && filteredUsers.length > 8 && (
          <Button variant="outline" onClick={() => setShowAll(true)}>Show All ({filteredUsers.length})</Button>
        )}
      </div>
      <div className="space-y-2">
        {displayUsers.map((u) => (
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
    </div>
  )
}

function PaymentMethodsManager() {
  const [methods, setMethods] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<any>(null)
  const [editingType, setEditingType] = useState<'bank_transfer' | 'crypto' | null>(null)
  const [newMethod, setNewMethod] = useState({ key: '', name: '', enabled: true, details: '{}' })

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

  const addMethod = async () => {
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch("/api/admin/payment-methods", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newMethod)
      })
      if (resp.ok) {
        fetchMethods()
        setShowAddForm(false)
        setNewMethod({ key: '', name: '', enabled: true, details: '{}' })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const updateMethod = async () => {
    if (!editingMethod) return
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/payment-methods/${editingMethod._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          key: editingMethod.key,
          name: editingMethod.name,
          enabled: editingMethod.enabled,
          details: typeof editingMethod.details === 'string' ? JSON.parse(editingMethod.details) : editingMethod.details
        })
      })
      if (resp.ok) {
        fetchMethods()
        setEditingMethod(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (resp.ok) {
        fetchMethods()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleEnabled = async (methodId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/payment-methods/${methodId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ enabled })
      })
      if (resp.ok) {
        fetchMethods()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const startEdit = (method: any) => {
    setEditingMethod(method)
    setEditingType(method.key === 'bank_transfer' ? 'bank_transfer' : method.key === 'crypto' ? 'crypto' : null)
  }

  const handleBankTransferSave = async (details: any) => {
    if (!editingMethod) return
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/payment-methods/${editingMethod._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          key: editingMethod.key,
          name: editingMethod.name,
          enabled: editingMethod.enabled,
          details
        })
      })
      if (resp.ok) {
        fetchMethods()
        setEditingMethod(null)
        setEditingType(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCryptoSave = async (details: any) => {
    if (!editingMethod) return
    try {
      const token = localStorage.getItem("token")
      const resp = await fetch(`/api/admin/payment-methods/${editingMethod._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          key: editingMethod.key,
          name: editingMethod.name,
          enabled: editingMethod.enabled,
          details
        })
      })
      if (resp.ok) {
        fetchMethods()
        setEditingMethod(null)
        setEditingType(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const cancelEdit = () => {
    setEditingMethod(null)
    setEditingType(null)
  }

  if (loading) return <div>Loading payment methods...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Method'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">Key</label>
                <UIInput 
                  value={newMethod.key} 
                  onChange={(e) => setNewMethod({...newMethod, key: e.target.value})} 
                  placeholder="bank_transfer" 
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Name</label>
                <UIInput 
                  value={newMethod.name} 
                  onChange={(e) => setNewMethod({...newMethod, name: e.target.value})} 
                  placeholder="Bank Transfer" 
                />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Details (JSON)</label>
              <textarea 
                className="w-full p-2 border rounded text-sm" 
                rows={4}
                value={newMethod.details} 
                onChange={(e) => setNewMethod({...newMethod, details: e.target.value})} 
                placeholder='{"account_number": "123456", "instructions": "Include order number"}'
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addMethod}>Add Payment Method</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingMethod && editingType === 'bank_transfer' && (
        <BankTransferForm
          details={{
            bankName: editingMethod.details?.bankName || editingMethod.details?.bank_name || '',
            accountNumber: editingMethod.details?.accountNumber || editingMethod.details?.account_number || '',
            routingNumber: editingMethod.details?.routingNumber || editingMethod.details?.routing_number || '',
            accountHolderName: editingMethod.details?.accountHolderName || editingMethod.details?.account_holder || '',
            swiftCode: editingMethod.details?.swiftCode || editingMethod.details?.swift_code || '',
            iban: editingMethod.details?.iban || '',
            instructions: editingMethod.details?.instructions || ''
          }}
          onSave={handleBankTransferSave}
          onCancel={cancelEdit}
        />
      )}

      {editingMethod && editingType === 'crypto' && (
        <CryptoPaymentForm
          details={{
            bitcoinAddress: editingMethod.details?.bitcoinAddress || editingMethod.details?.bitcoin_address || '',
            ethereumAddress: editingMethod.details?.ethereumAddress || editingMethod.details?.ethereum_address || '',
            usdcAddress: editingMethod.details?.usdcAddress || editingMethod.details?.usdc_address || '',
            litecoinAddress: editingMethod.details?.litecoinAddress || editingMethod.details?.litecoin_address || '',
            instructions: editingMethod.details?.instructions || ''
          }}
          onSave={handleCryptoSave}
          onCancel={cancelEdit}
        />
      )}

      {editingMethod && !editingType && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                This payment method type doesn't have a specialized form yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Supported types: Bank Transfer, Cryptocurrency
              </p>
              <Button variant="outline" onClick={cancelEdit} className="mt-4">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {methods.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No payment methods configured. Add your first payment method to get started.
          </div>
        )}
        {methods.map((m) => (
          <div key={m._id} className="flex items-center justify-between p-3 border rounded">
            <div className="flex-1">
              <div className="font-medium">{m.name} <span className="text-xs text-muted-foreground">({m.key})</span></div>
              <div className="text-sm text-muted-foreground mt-1">
                {Object.keys(m.details || {}).length} configuration items
              </div>
              {m.details && Object.keys(m.details).length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                  {Object.entries(m.details).slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  {Object.keys(m.details).length > 2 && '...'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.enabled ? "default" : "secondary"}>
                {m.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => startEdit(m)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => toggleEnabled(m._id, !m.enabled)}
              >
                {m.enabled ? "Disable" : "Enable"}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteMethod(m._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
  const [error, setError] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('No authentication token found')
          setLoading(false)
          return
        }
        const resp = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
        if (resp.status === 401 || resp.status === 403) {
          setError('Admin access required')
          setLoading(false)
          return
        }
        if (!resp.ok) {
          setError(`Failed to load settings: ${resp.status}`)
          setLoading(false)
          return
        }
        const data = await resp.json()
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber)
        if (data.brandColor) setBrandColor(data.brandColor)
        setError('')
      } catch (e) {
        console.error(e)
        setError('Network error loading settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        return
      }
      const resp = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ whatsappNumber, brandColor }),
      })
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${resp.status}`)
      }
      setError('')
      alert('Settings saved successfully')
    } catch (e) {
      console.error(e)
      setError(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  if (loading) return <div>Loading settings...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm block mb-1">WhatsApp Number (E.164)</label>
          <UIInput value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+15551234567" />
        </div>
        <div>
          <label className="text-sm block mb-1">Brand Color (hex)</label>
          <UIInput value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#6b3d2e" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  )
}