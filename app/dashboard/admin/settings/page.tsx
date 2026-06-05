"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CreditCard, Home, LogOut, Save, Settings, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const [emailSettings, setEmailSettings] = useState({
    enableEmailNotifications: true,
    sendRegistrationConfirmation: true,
    sendPaymentConfirmation: true,
    sendSeatAllocationNotification: true,
    sendExamReminders: true,
    reminderDays: "3",
  })

  const [systemSettings, setSystemSettings] = useState({
    siteTitle: "Exam Registration System",
    contactEmail: "support@examreg.com",
    autoAllocateSeats: false,
    allowLateRegistration: true,
    lateRegistrationFee: "10",
    maintenanceMode: false,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    currency: "USD",
    enableOnlinePayments: true,
    acceptCreditCards: true,
    acceptPayPal: true,
    acceptBankTransfer: true,
    paymentInstructions: "Please complete your payment within 48 hours of registration.",
  })

  const { toast } = useToast()
  const router = useRouter()

  const handleEmailSettingsChange = (field: string, value: any) => {
    setEmailSettings({
      ...emailSettings,
      [field]: value,
    })
  }

  const handleSystemSettingsChange = (field: string, value: any) => {
    setSystemSettings({
      ...systemSettings,
      [field]: value,
    })
  }

  const handlePaymentSettingsChange = (field: string, value: any) => {
    setPaymentSettings({
      ...paymentSettings,
      [field]: value,
    })
  }

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    })
  }

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-card p-4 shadow-md md:flex">
        <div className="mb-8 flex items-center space-x-2">
          <div className="text-xl font-bold">
            <span className="text-primary">Exam</span>
            <span>Registration</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/admin">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/admin/exams">
              <BookOpen className="mr-2 h-4 w-4" />
              Exams
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/admin/registrations">
              <Users className="mr-2 h-4 w-4" />
              Registrations
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/admin/payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-accent" asChild>
            <Link href="/dashboard/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </nav>
        <div className="pt-4">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, Admin</span>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                A
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure the general settings for the exam registration system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input
                      id="siteTitle"
                      value={systemSettings.siteTitle}
                      onChange={(e) => handleSystemSettingsChange("siteTitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={systemSettings.contactEmail}
                      onChange={(e) => handleSystemSettingsChange("contactEmail", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoAllocateSeats">Auto-Allocate Seats</Label>
                    <Switch
                      id="autoAllocateSeats"
                      checked={systemSettings.autoAllocateSeats}
                      onCheckedChange={(checked) => handleSystemSettingsChange("autoAllocateSeats", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically allocate seats to students when they complete payment.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowLateRegistration">Allow Late Registration</Label>
                    <Switch
                      id="allowLateRegistration"
                      checked={systemSettings.allowLateRegistration}
                      onCheckedChange={(checked) => handleSystemSettingsChange("allowLateRegistration", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow students to register after the registration deadline with an additional fee.
                  </p>
                </div>
                {systemSettings.allowLateRegistration && (
                  <div className="space-y-2">
                    <Label htmlFor="lateRegistrationFee">Late Registration Fee (₹)</Label>
                    <Input
                      id="lateRegistrationFee"
                      type="number"
                      value={systemSettings.lateRegistrationFee}
                      onChange={(e) => handleSystemSettingsChange("lateRegistrationFee", e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => handleSystemSettingsChange("maintenanceMode", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Put the system in maintenance mode. Only administrators will be able to access the system.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Email Settings Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure email notification settings for the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
                    <Switch
                      id="enableEmailNotifications"
                      checked={emailSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => handleEmailSettingsChange("enableEmailNotifications", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable all email notifications from the system.
                  </p>
                </div>
                {emailSettings.enableEmailNotifications && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sendRegistrationConfirmation">Registration Confirmation</Label>
                        <Switch
                          id="sendRegistrationConfirmation"
                          checked={emailSettings.sendRegistrationConfirmation}
                          onCheckedChange={(checked) =>
                            handleEmailSettingsChange("sendRegistrationConfirmation", checked)
                          }
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send email confirmation when a student registers for an exam.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sendPaymentConfirmation">Payment Confirmation</Label>
                        <Switch
                          id="sendPaymentConfirmation"
                          checked={emailSettings.sendPaymentConfirmation}
                          onCheckedChange={(checked) => handleEmailSettingsChange("sendPaymentConfirmation", checked)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send email confirmation when a payment is received.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sendSeatAllocationNotification">Seat Allocation Notification</Label>
                        <Switch
                          id="sendSeatAllocationNotification"
                          checked={emailSettings.sendSeatAllocationNotification}
                          onCheckedChange={(checked) =>
                            handleEmailSettingsChange("sendSeatAllocationNotification", checked)
                          }
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send email notification when a seat is allocated to a student.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sendExamReminders">Exam Reminders</Label>
                        <Switch
                          id="sendExamReminders"
                          checked={emailSettings.sendExamReminders}
                          onCheckedChange={(checked) => handleEmailSettingsChange("sendExamReminders", checked)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Send email reminders before the exam date.</p>
                    </div>
                    {emailSettings.sendExamReminders && (
                      <div className="space-y-2">
                        <Label htmlFor="reminderDays">Days Before Exam</Label>
                        <Select
                          value={emailSettings.reminderDays}
                          onValueChange={(value) => handleEmailSettingsChange("reminderDays", value)}
                        >
                          <SelectTrigger id="reminderDays">
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="2">2 days</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure payment settings for the exam registration system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={paymentSettings.currency}
                    onValueChange={(value) => handlePaymentSettingsChange("currency", value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableOnlinePayments">Enable Online Payments</Label>
                    <Switch
                      id="enableOnlinePayments"
                      checked={paymentSettings.enableOnlinePayments}
                      onCheckedChange={(checked) => handlePaymentSettingsChange("enableOnlinePayments", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Allow students to pay exam fees online.</p>
                </div>
                {paymentSettings.enableOnlinePayments && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="acceptCreditCards">Accept Credit Cards</Label>
                        <Switch
                          id="acceptCreditCards"
                          checked={paymentSettings.acceptCreditCards}
                          onCheckedChange={(checked) => handlePaymentSettingsChange("acceptCreditCards", checked)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="acceptPayPal">Accept PayPal</Label>
                        <Switch
                          id="acceptPayPal"
                          checked={paymentSettings.acceptPayPal}
                          onCheckedChange={(checked) => handlePaymentSettingsChange("acceptPayPal", checked)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="acceptBankTransfer">Accept Bank Transfer</Label>
                        <Switch
                          id="acceptBankTransfer"
                          checked={paymentSettings.acceptBankTransfer}
                          onCheckedChange={(checked) => handlePaymentSettingsChange("acceptBankTransfer", checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                  <Textarea
                    id="paymentInstructions"
                    value={paymentSettings.paymentInstructions}
                    onChange={(e) => handlePaymentSettingsChange("paymentInstructions", e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    These instructions will be shown to students on the payment page.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

