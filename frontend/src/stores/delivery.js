import { defineStore } from 'pinia'

export const useDeliveryStore = defineStore('delivery', {
  state: () => ({
    building: '',
    floor: '',
    facilityType: '',
    roomNumber: '',
    date: '',
    time: ''
  }),
  actions: {
    setDeliveryInfo({ building, floor, facilityType, roomNumber, date, time }) {
      this.building = building
      this.floor = floor
      this.facilityType = facilityType
      this.roomNumber = roomNumber
      this.date = date
      this.time = time
    }
  }
})
