<template>
  <Form @addMeetup="addMeetup" />
</template>

<script>
import Form from '~/components/meetups/Form'

export default {
  components: {
    Form
  },
  methods: {
    addMeetup (payload) {
      this.$store.dispatch('addMeetup', payload)
        .then(() => {
          this.$store.dispatch('clearLoading')
          if (!this.$store.getters.error) {
            this.$router.push('/admin/meetups')
          } else {
            console.log('Error on adding meetup')
          }
        })
    }
  },
  middleware: ['checkAuth']
}
</script>
