<template>
  <nav>
    <!-- Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
    >
      <v-toolbar flat dark class="primary">
        <v-list>
          <v-list-tile>
            <v-list-tile-title class="title">
              Meetups
            </v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-toolbar>

      <v-divider />

      <v-list dense class="pt-0">
        <!-- Expandable when subItems available -->
        <template v-for="item in menuItems">
          <v-list-group v-if="item.subItems" :key="item.title" no-action>
            <template v-slot:activator>
              <v-list-tile>
                <v-list-tile-action>
                  <v-avatar v-if="item.avatar && user.imgUrl"
                    class="mr-2"
                    size="36px"
                  >
                    <img
                      :src="user.imgUrl"
                      alt="Avatar"
                    >
                  </v-avatar>
                  <v-icon v-else>
                    {{ item.icon }}
                  </v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
            </template>

            <template v-for="subItem in item.subItems">
              <v-list-tile
                :key="subItem.title"
                router
                :to="subItem.route"
                exact
                @click="profileMenu(subItem)"
              >
                <v-list-tile-action>
                  <v-icon>{{ subItem.icon }}</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                  <v-list-tile-title>{{ subItem.title }}</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
            </template>
          </v-list-group>
        <!-- Normal links when no subItems -->
          <v-list-tile v-else
            :key="item.title"
            router
            :to="item.route"
            exact
          >
            <v-list-tile-action>
              <v-icon v-if="!item.avatar">
                {{ item.icon }}
              </v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>

    </v-navigation-drawer>

    <!-- Toolbar -->
    <v-toolbar app dark class="primary">

      <v-toolbar-side-icon
        class="hidden-sm-and-up"
        @click="drawer = !drawer"
      />

      <v-toolbar-title class="white--text">
        <nuxt-link to="/" tag="span" style="cursor: pointer">Meetups</nuxt-link>
      </v-toolbar-title>

      <v-spacer />

      <v-toolbar-items class="hidden-xs-only">
        <template v-for="item in menuItems">
          <v-btn v-if="!item.subItems"
            :key="item.title"
            exact
            flat 
            router
            :to="item.route"
          >
            <v-icon left>
              {{ item.icon }}
            </v-icon>
          {{ item.title }}
          </v-btn>

          <!-- Dropdown menu for Meetups -->
          <v-menu v-if="item.subItems && item.title==='Meetups'" :key="item.title" offset-y >
            <v-btn
              slot="activator"
              flat
              dark
            >
              <v-icon left>
                {{ item.icon }}
              </v-icon>
                Meetups
              <v-icon class="ml-2">
                expand_more
              </v-icon>
            </v-btn>
            <v-list>
              <template v-for="(item, index) in item.subItems">
                <v-list-tile
                  :key="index"
                  router
                  :to="item.route"
                  exact
                >
                  <v-list-tile-action>
                    <v-icon>{{ item.icon }}</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                </v-list-tile>
              </template>
            </v-list>
          </v-menu>

          <!-- Dropdown menu for Profile -->
          <v-menu v-if="item.subItems && item.title==='Profile'" :key="item.title" offset-y >
            <v-btn
              slot="activator"
              flat
              dark
            >
              <v-avatar class="mr-2" v-if="user.imgUrl"
                size="36px"
              >
                <img
                  :src="user.imgUrl"
                  alt="Avatar"
                >
              </v-avatar>
              <v-icon left v-else>
                person
              </v-icon>
                Profile
              <v-icon class="ml-2">
                expand_more
              </v-icon>
            </v-btn>
            <v-list>
              <template v-for="(item, index) in item.subItems">
                <v-list-tile
                  :key="index"
                  router
                  :to="item.route"
                  exact
                  @click="profileMenu(item)"
                >
                  <v-list-tile-action>
                    <v-icon>{{ item.icon }}</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                </v-list-tile>
              </template>
            </v-list>
          </v-menu>
        </template>
      </v-toolbar-items>
    </v-toolbar>

  </nav>
</template>

<script>
export default {
  data () {
    return {
      drawer: false,
    }
  },
  computed: {
    menuItems () {
      let menuItems = [
        { title: 'View Meetups', icon: 'supervisor_account', route: '/meetups' },
        { title: 'Login', icon: 'exit_to_app', route: '/auth?isLogin=true' },
        { title: 'Register', icon: 'account_circle', route: '/auth?isLogin=false' }
      ]
      if (this.isLoggedIn) {
        menuItems = [
          { title: 'Meetups', icon: 'supervisor_account', subItems: [
            { title: 'View Meetups', icon: 'supervisor_account', route: '/meetups' },
            { title: 'My Meetups', icon: 'person_pin_circle', route: '/admin/meetups' },
            { title: 'Joined Meetups', icon: 'add_location', route: '/admin/meetups/joined' },
            { title: 'Organise Meetup', icon: 'group_add', route: '/admin/meetups/new' },

          ]},

          { title: 'View Users', icon: 'person_add', route: '/admin/users' },

          { title: 'Profile', icon: 'person', avatar: this.user.imgUrl, subItems: [
              { title: 'Edit', icon: 'edit', route: '/admin/users/' + this.$store.getters.user.id  }, 
              { title: 'Logout', icon: 'arrow_back' }
            ]
          }
        ]
      }
      return menuItems
    },
    isLoggedIn () {
      return this.$store.getters.isLoggedIn
    },
    user () {
      return this.$store.getters.user
    },
    avatar () {
      return this.$store.getters.user.imgUrl === '' ?false :true
    }
  },
  methods: {
    profileMenu (item) {
      if (item.title === 'Logout') {
        this.$store.dispatch('logout')
        this.$router.push('/')
      }
    }
  }
}
</script>
