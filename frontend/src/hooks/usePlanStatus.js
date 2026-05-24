import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export function usePlanStatus() {
  const { currentUser } = useAuth()
  const [planStatus, setPlanStatus] = useState({
    isExpired: false,
    daysLeft: null,
    plan: 'free',
    planEndDate: null,
    loading: true
  })

  useEffect(() => {
    async function checkPlan() {
      if (!currentUser) return
      const ADMIN_EMAIL = 'vnitin398@gmail.com'
      if (currentUser.email === ADMIN_EMAIL) {
        setPlanStatus({ isExpired: false, daysLeft: 999, plan: 'admin', planEndDate: null, loading: false })
        return
      }
      try {
        const res = await axios.get(`${API}/owner/${currentUser.uid}`)
        const owner = res.data
        if (!owner.planEndDate) {
          setPlanStatus({ isExpired: false, daysLeft: null, plan: owner.plan || 'free', planEndDate: null, loading: false })
          return
        }
        const today = new Date()
        const endDate = new Date(owner.planEndDate)
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        setPlanStatus({
          isExpired: daysLeft < 0,
          daysLeft,
          plan: owner.plan || 'free',
          planEndDate: owner.planEndDate,
          memberLimit: owner.memberLimit,
          gymmitraId: owner.gymmitraId,
          loading: false
        })
      } catch (err) {
        setPlanStatus({ isExpired: false, daysLeft: null, plan: 'free', planEndDate: null, loading: false })
      }
    }
    checkPlan()
  }, [currentUser])

  return planStatus
}