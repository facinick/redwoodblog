// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route, Private, Set, Redirect, routes } from '@redwoodjs/router'
import { useAuth } from './auth'
import NoProsePostLayout from './layouts/NoProsePostLayout/NoProsePostLayout'
import PostLayout from './layouts/PostLayout/PostLayout'
import ResponsiveLayout from './layouts/ResponsiveLayout/ResponsiveLayout'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Set wrap={ResponsiveLayout}>
        {/* Public Routes */}
        <Private unauthenticated="home">
          <Set wrap={PostLayout}>
            <Route path="/posts/new" page={PostNewPostPage} name="newPost" />
            <Route path="/posts/{id:Int}/edit" page={PostEditPostPage} name="editPost" />
          </Set>
        </Private>

        {/* Public Routes */}
        <Route path="/" page={HomePage} name="home" />
        <Set wrap={PostLayout}>
          <Route path="/post/{id:Int}" page={PostPostPage} name="post" />
        </Set>
        <Set wrap={NoProsePostLayout}>
          <Route path="/blog" page={BlogPage} name="blog" />
        </Set>
        <Route path="/profile/{username:String}" page={ProfilePage} name="profile" />
        <Route path="/login" page={LoginPage} name="login" />
        <Route path="/signup" page={SignupPage} name="signup" />
      </Set>
      <Route notfound page={NotFoundPage} />
      <Route path="/admin" page={() => <Redirect to={routes.login()} />} name="admin" />
    </Router>
  )
}

export default Routes
