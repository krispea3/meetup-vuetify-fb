import { fireAuth, fireStore, fireDb, fireStorage } from '~/plugins/firebase.js'


export const state = () => ({
  user: '',
  users: [],
  meetups: [],
  meetupsSort: {
    name: '',
    orderAsc: false,
    orderDesc: false
  },
  loading: [],
  error: null,
  searchString: ''
})

export const mutations = {
  loadUser (state, user) {
    state.user = user
  },
  loadUsers (state, users) {
    state.users = users
  },
  logoutUser (state) {
    state.user = ''
  },
  addUserToUsers (state, user) {
    state.users.push(user)
  },
  updateUser (state, formData) {
    state.user.firstname = formData.firstname
    state.user.surname = formData.surname
    state.user.imgUrl = formData.imgUrl
    state.user.imgName = formData.imgName
    // update user in users
    const userIndex = state.users.findIndex(i => i.id === formData.id)
    state.users[userIndex].firstname = formData.firstname
    state.users[userIndex].surname = formData.surname
    state.users[userIndex].imgUrl = formData.imgUrl
    state.users[userIndex].imgName = formData.imgName
  },
  clearUserImageFields (state, userId) {
    state.user.imgUrl = ''
    state.user.imgName = ''
    // update user in users
    const userIndex = state.users.findIndex(i => i.id === userId)
    state.users[userIndex].imgUrl = ''
    state.users[userIndex].imgName = ''
  },
  addMeetupToUser (state, payload) {
    state.user.registeredMeetups.push(payload.idMeetup)
    // update user in users
    const userIndex = state.users.findIndex(i => i.id === payload.idUser)
    state.users[userIndex].registeredMeetups.push(payload.idMeetup)
  },
  removeMeetupFromUser (state, payload) {
    const index = state.user.registeredMeetups.lastIndexOf(payload.idMeetup)
    if (index > -1) {
      state.user.registeredMeetups.splice(index, 1)
    }
    // update user in users
    const userIndex = state.users.findIndex(i => i.id === payload.idUser)
    const registeredIndex = state.users[userIndex].registeredMeetups.lastIndexOf(payload.idMeetup)
    if (registeredIndex > -1) {
      state.users[userIndex].registeredMeetups.splice(registeredIndex, 1)
    }
  },
  loadMeetups (state, meetups) {
    state.meetups = meetups
  },
  addMeetup (state, meetup) {
    state.meetups.push(meetup)
  },
  updateMeetup (state, formData) {
    const index = state.meetups.findIndex(i => i.id == formData.id)
    if (index >= 0) {
      state.meetups[index] = formData
    }
  },
  deleteMeetupFromMeetups (state, id) {
    const index = state.meetups.findIndex(i => i.id == id)
    if (index > -1) {
      state.meetups.splice(index, 1)
    }
  },
  clearMeetupImageFields (state, meetupId) {
    const index = state.meetups.findIndex(i => i.id == meetupId)
    if (index >= 0) {
      state.meetups[index].imgName = ''
      state.meetups[index].imgUrl = ''
    }
  },
  setMeetupsSort (state, meetupsSort) {
    state.meetupsSort = meetupsSort
  },
  sortMeetups (state) {
    if (state.meetupsSort.name !== '') {
      let sortField = state.meetupsSort.name.toLowerCase()
      const sortAsc = state.meetupsSort.orderAsc
      const sortDesc = state.meetupsSort.orderDesc
      const fieldType = typeof(sortField)

      const sortedMeetups = state.meetups.sort( (a, b) => {
          if (fieldType === 'string') {
            if (sortAsc)
              if (a[sortField] > b[sortField]) {
                return 1
              } else if (b[sortField] > a[sortField]) {
                return -1
              } else {
                return 0
              }
            else {
              if (b[sortField] > a[sortField]) {
                return 1
              } else if (a[sortField] > b[sortField]) {
                return -1
              } else {
                return 0
              }
            }

          } else {
            if (sortAsc) {
              return a[sortField] - b[sortField]
            } else {
              return b[sortField] - a[sortField]
            }
          } 
      })
      state.meetups = sortedMeetups
    }
  },

  setError (state, error) {
    state.error = error
  },
  clearError (state) {
    state.error = null
  },
  loading (state, payload) {
    state.loading = payload
  },
  clearLoading (state) {
    state.loading = []
  },
  setSearchString (state, searchString) {
    state.searchString = searchString
  },
  clearSearch (state) {
    state.searchString = ''
  }
}

export const actions = {
  nuxtServerInit (vuexContext, serverContext) {
    console.log('nuxtServerInit')
    // Read meetups
    let meetups = []
    return fireDb.collection("meetups").get()
    .then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
          // doc.data() is never undefined for query doc snapshots
          // console.log(doc.id, " => ", doc.data())
          meetups.push({...doc.data(), id: doc.id})
      })
      vuexContext.commit('loadMeetups', meetups)
      // vuexContext.commit('setMeetupsSort', {name: 'Date', orderAsc: false, orderDesc: true})
      // vuexContext.commit('sortMeetups')

      // Load Users
      return fireDb.collection('users').get()
        .then(docs => {
          let users = []
          docs.forEach(doc => {
            let user = {...doc.data(), id: doc.id }
            users.push(user)
          })
          vuexContext.commit('loadUsers', users)
          
          // Load userData
          let signedInUser = ''
          const authId = serverContext.app.$cookies.get('userId')
          if (authId != undefined) {
            return fireDb.collection('users').where('authid', "==", authId).get()
              .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    // doc.data() is never undefined for query doc snapshots
                    signedInUser = {...doc.data(), id: doc.id}
                  })
                vuexContext.commit('loadUser', signedInUser)
              })
              .catch(function(error) {
                  console.log("Error getting documents: ", error);
              })
          } else {
            return signedInUser
          }

        })
        .catch(err => {
          console.error(err)
        })
          
      })
      
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    })
    
  },
  register ({ commit }, formData) {
    let key = ''
    let imageUrl = ''
    let imageName = ''

    return (
      fireAuth.createUserWithEmailAndPassword(formData.email, formData.password)
        .then(res => {
          // Write user to firebase
          const user = {
            authid: res.user.uid,
            firstname: formData.firstname,
            surname: formData.surname,
            imgUrl: '',
            imgName: '',
            email: formData.email,
            registeredMeetups: []
          }
          return (
            fireDb.collection("users").add(user)
              .then(function(docRef) {
                // Write user to state
                const newUser = { ...user, id: docRef.id }
                key = docRef.id
                // Upload image to firestore
                if (formData.image) {
                  console.log('image found')
                  const name = formData.image.name
                  const ext = name.slice(name.lastIndexOf('.'))
                  const ref = fireStorage.ref('users/' + docRef.id + ext)
                  return ref.put(formData.image)
                    .then(snapshot => {
                      console.log('image uploaded')
                      console.log(snapshot.metadata)
                      imageName = snapshot.metadata.name
                      return snapshot.ref.getDownloadURL()
                        .then(downloadURL => {
                          imageUrl = downloadURL
                          console.log('imageUrl: ', imageUrl)
                          const userRef = fireDb.collection('users').doc(key)
                          const setWithMerge = userRef.set({
                            imgUrl: imageUrl,
                            imgName: imageName
                          }, { merge: true })
                          return setWithMerge
                            .then(() => {
                              newUser.imgUrl = imageUrl
                              newUser.imgName = imageName
                              console.log('Image URL updated')
                              commit('clearError')
                              commit('loadUser', newUser)
                              commit('addUserToUsers', newUser)
                            })
                            .catch(err => console.log(err))
                        })
                        .catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                } else {
                  commit('clearError')
                  commit('loadUser', newUser)
                  commit('addUserToUsers', newUser)
                }
              })
              .catch(function(err) {
                commit('setError', err)
                  console.error("Error adding document: ", err);
              })
          )
        })
        .catch(err => {
          commit('setError', err)
          console.error(err)
        })
    )
  },
  login ({ commit }, formData) {
    return fireAuth.signInWithEmailAndPassword(formData.email, formData.password)
      .then(res => {
        console.log('user signed in on firebase')
        let user = {}
        const usersRef = fireDb.collection("users")
        const query =  usersRef.where("authid", "==", res.user.uid)
         return query.get()
          .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
              user = {...doc.data(), id: doc.id}
            })
            commit('clearError')
            commit('loadUser', user)
          })
          .catch(err => {
            commit('setError', err)
            console.error(err)
          })
        })
        .catch(err => {
          commit('setError', err)
          console.error(err)
        })
  },
  logout ({commit}) {
    fireAuth.signOut()
      .then(function() {
        console.log('User signedOut of Firebase')
      })
      .catch(function(error) {
        console.log(error)
      })
  },
  logoutUser ({ commit }) {
    commit('logoutUser')
  },
  updateProfile ({ commit, dispatch }, payload) {
    // When new image uploaded
    if (payload.formData.image) {
      // Upload image and update user with imgName and imgUrl
      const name = payload.formData.image.name
      const ext = name.slice(name.lastIndexOf('.'))
      const ref = fireStorage.ref('users/' + payload.userid + ext)
      return ref.put(payload.formData.image)
        .then(snapshot => {
          console.log('image uploaded')
          payload.formData.imgName = snapshot.metadata.name
          return snapshot.ref.getDownloadURL()
            .then(downloadURL => {
              payload.formData.imgUrl = downloadURL
              dispatch('updateUser', payload)
                .then(() => {
                  console.log('User updated')
                })
            })
          })
    }
    // When no new image uploaded
    dispatch('updateUser', payload)
      .then(() => {
        console.log('User updated')
      })
      .catch(err => console.error(err))
  },
  updateUser ({ commit }, payload) {
    const userRef = fireDb.collection('users').doc(payload.userid)
    const setWithMerge = userRef.set({
      firstname: payload.formData.firstname,
      surname: payload.formData.surname,
      imgUrl: payload.formData.imgUrl,
      imgName: payload.formData.imgName
    }, { merge: true })
    return setWithMerge
      .then(function() {
        payload.formData.id = payload.userid
        commit('updateUser', payload.formData)
        commit('clearError')
      })
      .catch((err) => {
        commit('setError', err)
          console.error("Error writing document: ", err);
      })
  },
  removeUserImage ({ commit }, payload) {
    // Create a reference to the file to delete
    const ref = fireStorage.ref('users/' + payload.imgName)
    // Delete the file
    return ref.delete()
      .then(function() {
        console.log('image deleted')
        // Clear image fields on user
        const userRef = fireDb.collection('users').doc(payload.userid)
        const setWithMerge = userRef.set({
          imgUrl: '',
          imgName: ''
        }, { merge: true })
      
        return setWithMerge
          .then(function() {
            commit('clearUserImageFields', payload.userid)
          })
          .catch((err) => {
            console.error("Error clearing image fields: ", err);
          })
      })
      .catch(function(error) {
        console.log(error)
      })
  },
  loadUsers ({ commit }) {
    return fireDb.collection('users').get()
      .then(docs => {
        docs.forEach(doc => {
          const userData = doc.data()
          const userId = doc.id
          user = {...userData, id: userId }
          commit('addUserToUsers', doc.data())
        })
      })
      .catch(err => {
        console.error(err)
      })
  },
  addMeetupToUser ({ commit }, payload) {
    return fireDb.collection("users").doc(payload.idUser).update({
      registeredMeetups: fireStore.FieldValue.arrayUnion(payload.idMeetup)
    })
      .then(response => {
        console.log(response)
        commit('addMeetupToUser', payload)
      })
      .catch(err => {
        console.error(err)
      })
  },
  removeMeetupFromUser ({ commit }, payload) {
    return fireDb.collection("users").doc(payload.idUser).update({
      registeredMeetups: fireStore.FieldValue.arrayRemove(payload.idMeetup)
    })
      .then(response => {
        console.log(response)
        commit('removeMeetupFromUser', payload)
      })
      .catch(err => {
        console.error(err)
      })
  },
  addMeetup ({ commit }, payload) {
    return fireDb.collection('meetups').add(payload.formData)
        .then(function(docRef) {
            payload.formData.id = docRef.id
            // Upload image if available
            if (payload.image) {
              const name = payload.image.name
              const ext = name.slice(name.lastIndexOf('.'))
              const ref = fireStorage.ref('meetups/' + payload.formData.id + ext)
              return ref.put(payload.image)
                .then(snapshot => {
                  payload.formData.imgName = snapshot.metadata.name
                  return snapshot.ref.getDownloadURL()
                    .then(downloadURL => {
                      payload.formData.imgUrl = downloadURL
                      // Update meetup with uploaded image data
                      return fireDb.collection('meetups').doc(payload.formData.id).set({
                        imgName: payload.formData.imgName,
                        imgUrl: payload.formData.imgUrl
                      }, { merge: true })
                        .then(() => {
                          commit('addMeetup', payload.formData)
                        })
                        .catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            // Add meetup when no images
            } else {
              console.log('enter no payload.image')
              commit('addMeetup', payload.formData)
            }            
        })
        .catch(function(error) {
            console.error("Error writing document: ", error)
        })
  },
  updateMeetup ({ commit }, payload) {
    if (payload.image) {
      // Image to upload
      const name = payload.image.name
      const ext = name.slice(name.lastIndexOf('.'))
      const ref = fireStorage.ref('meetups/' + payload.meetupId + ext)
      return ref.put(payload.image)
        .then(snapshot => {
          payload.formData.imgName = snapshot.metadata.name
          return snapshot.ref.getDownloadURL()
            .then(downloadURL => {
              payload.formData.imgUrl = downloadURL
              // Update meetup with uploaded image data
              return fireDb.collection('meetups').doc(payload.meetupId).set(payload.formData, { merge: true })
                .then(() => {
                  payload.formData.id = payload.meetupId
                  commit('updateMeetup', payload.formData)
                })
                .catch(err => console.log(err))
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))   
    } else {
      // No image to upload
      return fireDb.collection('meetups').doc(payload.meetupId).set(payload.formData, { merge: true })
        .then(() => {
          payload.formData.id = payload.meetupId
          commit('updateMeetup', payload.formData)
        })
        .catch(err => console.log(err))
    }
  },
  removeMeetupImage ({ commit, dispatch }, payload) {
    // Create a reference to the file to delete
    // const ref = fireStorage.ref('meetups/' + payload.imgName)
    // Delete the file
    // return ref.delete()
    return dispatch('deleteMeetupImage', payload.imgName)
      .then(function() {
        // Clear image fields on meetup
        const userRef = fireDb.collection('meetups').doc(payload.meetupId)
        const setWithMerge = userRef.set({
          imgUrl: '',
          imgName: ''
        }, { merge: true })
      
        return setWithMerge
          .then(function() {
            commit('clearMeetupImageFields', payload.meetupId)
          })
          .catch((err) => {
            console.error("Error clearing image fields: ", err);
          })
      })
      .catch(function(error) {
        console.log(error)
      })
  },
  deleteMeetupImage ({ commit }, imgName) {
    // Create a reference to the file to delete
    const ref = fireStorage.ref('meetups/' + imgName)
    // Delete the file
    return ref.delete()
      .then(() => {
        console.log('image deleted')
      })
      .catch(err => {
        console.error(err)
      })
  },
  deleteMeetup ({ commit }, id) {
    return fireDb.collection('meetups').doc(id).delete()
      .then(() => {
        console.log('meetup deleted(store)')
        commit('deleteMeetupFromMeetups', id)
      })
      .catch(err => {
        console.error(err)
      })
  },
  setMeetupsSort ({ commit }, meetupsSort) {
    commit('setMeetupsSort', meetupsSort)
  },
  sortMeetups ({ commit }) {
    commit('sortMeetups')
  },
  clearError ({ commit }) {
    commit('clearError')
  },
  loading ( {commit }, payload) {
    commit('loading', payload)
  },
  clearLoading ({ commit }) {
    commit('clearLoading')
  },
  setSearchString ({ commit }, searchString) {
    commit('setSearchString', searchString)
  }
}

export const getters = {
  error (state) {
    return state.error
  },
  user (state) {
    return state.user
  },
  users (state) {
    return state.users
  },
  meetups (state) {
    return state.meetups
  },
  meetupsSort (state) {
    return state.meetupsSort
  },
  isLoggedIn (state) {
    if (state.user.id) {
      return true
    } else {
      return false
    }
  },
  loading (state) {
    return state.loading
  },
  searchString (state) {
    return state.searchString
  }
}