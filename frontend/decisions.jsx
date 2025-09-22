import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  User,
  MapPin,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'
import { blink } from '@/blink/client'
import { LandRecord, BenefitScheme, BenefitEligibility } from '@/types'

export function DecisionSupport() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<LandRecord | null>(null)
  const [landRecords, setLandRecords] = useState<LandRecord[]>([])
  const [benefitSchemes, setBenefitSchemes] = useState<BenefitScheme[]>([])
  const [eligibilityResults, setEligibilityResults] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [records, schemes] = await Promise.all([
        blink.db.landRecords.list(),
        blink.db.benefitSchemes.list()
      ])
      setLandRecords(records)
      setBenefitSchemes(schemes)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const checkEligibility = async (record: LandRecord) => {
    setLoading(true)
    try {
      const results: { [key: string]: boolean } = {}
      
      // Check eligibility for each scheme
      for (const scheme of benefitSchemes) {
        let eligible = true
        const reasons: string[] = []

        // Check land area limits
        if (scheme.maxLandLimit && record.areaAcres > scheme.maxLandLimit) {
          eligible = false
          reasons.push(`Land area (${record.areaAcres} acres) exceeds maximum limit (${scheme.maxLandLimit} acres)`)
        }

        if (scheme.minLandLimit && record.areaAcres < scheme.minLandLimit) {
          eligible = false
          reasons.push(`Land area (${record.areaAcres} acres) below minimum requirement (${scheme.minLandLimit} acres)`)
        }

        // Only approved claims are eligible
        if (record.claimStatus !== 'approved') {
          eligible = false
          reasons.push('Land claim must be approved first')
        }

        // Specific scheme rules
        if (scheme.schemeCode === 'PM_KISAN' && record.landType !== 'agricultural') {
          eligible = false
          reasons.push('PM Kisan requires agricultural land')
        }

        results[scheme.id] = eligible

        // Store eligibility in database
        await blink.db.benefitEligibility.create({
          id: `${record.id}_${scheme.id}`,
          landRecordId: record.id,
          schemeId: scheme.id,
          isEligible: eligible,
          eligibilityReason: reasons.join('; '),
          applicationStatus: eligible ? 'eligible' : 'not_applied',
          userId: 'current-user-id'
        })
      }

      setEligibilityResults(results)
    } catch (error) {
      console.error('Error checking eligibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = landRecords.filter(record =>
    record.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.recordNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Decision Support System</h1>
        <p className="text-muted-foreground mt-2">
          Verify benefit scheme eligibility for landholders and tribal communities
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by owner name, village, or record number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Advanced Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Land Records List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Land Records</CardTitle>
              <CardDescription>
                Select a record to check benefit eligibility
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    {searchTerm ? 'No records match your search' : 'No land records found'}
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                          selectedRecord?.id === record.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{record.ownerName}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {record.village}, {record.district}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.areaAcres} acres • {record.landType}
                            </p>
                          </div>
                          <Badge
                            variant={
                              record.claimStatus === 'approved' ? 'default' :
                              record.claimStatus === 'pending' ? 'secondary' : 'destructive'
                            }
                            className="text-xs ml-2"
                          >
                            {record.claimStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Record Details & Eligibility */}
        <div className="lg:col-span-2">
          {!selectedRecord ? (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a land record to check benefit scheme eligibility</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Record Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {selectedRecord.ownerName}
                      </CardTitle>
                      <CardDescription>
                        Record Number: {selectedRecord.recordNumber}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => checkEligibility(selectedRecord)}
                      disabled={loading}
                    >
                      {loading ? 'Checking...' : 'Check Eligibility'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedRecord.village}, {selectedRecord.district}, {selectedRecord.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Area:</span>
                        <span className="font-medium">{selectedRecord.areaAcres} acres</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Land Type:</span>
                        <span className="font-medium capitalize">{selectedRecord.landType}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Father's Name:</span>
                        <span className="font-medium">{selectedRecord.fatherName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Survey No:</span>
                        <span className="font-medium">{selectedRecord.surveyNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            selectedRecord.claimStatus === 'approved' ? 'default' :
                            selectedRecord.claimStatus === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {selectedRecord.claimStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefit Scheme Eligibility */}
              <Card>
                <CardHeader>
                  <CardTitle>Benefit Scheme Eligibility</CardTitle>
                  <CardDescription>
                    Eligibility status for government benefit schemes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(eligibilityResults).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Click "Check Eligibility" to verify benefit scheme eligibility
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {benefitSchemes.map((scheme) => {
                        const isEligible = eligibilityResults[scheme.id]
                        return (
                          <div
                            key={scheme.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {isEligible ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  <h3 className="font-medium">{scheme.schemeName}</h3>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {scheme.schemeCode}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {scheme.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {scheme.maxLandLimit && (
                                  <span>Max: {scheme.maxLandLimit} acres</span>
                                )}
                                {scheme.incomeLimit && (
                                  <span>Income: ₹{scheme.incomeLimit.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={isEligible ? 'default' : 'destructive'}
                                className="mb-2"
                              >
                                {isEligible ? 'Eligible' : 'Not Eligible'}
                              </Badge>
                              {isEligible && (
                                <div>
                                  <Button size="sm" variant="outline">
                                    Apply Now
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}