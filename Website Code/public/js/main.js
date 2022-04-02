const API_HOST = "."; // leave blank if testing locally
//const API_HOST = "http://45.55.44.163/json";

// configuration to build nav bar on the side based on user's role
// this was introduced so we can share pages for the
// same role (e.g. messenger) and easily display the correct navbar
const ROLE_NAVIGATION = {
  //
  all: [
    {
      label: "Account"
    },
    {
      label: "Messages",
      icon: "mail",
      href: "messages.html"
    },
    {
      label: "Log Out",
      icon: "log-out",
      href: function () {
        if (confirm("Are you sure you want to end your session?")) {
          window.localStorage.removeItem("user");
          return document.location = "index.html";
        }
      }
    }
  ],
  student: [
    {
      label: "Dashboard",
      href: "student-dashboard.html",
      icon: "home"
    },
    { // leave other fields out to just have a header label
      label: "Courses",
    },
    { // add id div to create an empty div for dynamic content
      id: "course-list-side",
      func: async _ => {
        let book = feather.icons.book.toSvg();
        const apiNav = await apiCall("student/courses");
        document.getElementById("course-list-side").innerHTML = "";
        for (let course of apiNav) {
          document.getElementById("course-list-side").innerHTML += `
                    <li class="nav-item">
                        <a class="nav-link" id="nav-btn1" href="student-gradebook.html?id=${course.course_id}">` +
              book +
              `${course.name} (${course.primary_code} ${course.secondary_code})
                        </a>
                    </li>
            `;
        }
      }
    },

    {
      label: "Utilities",
    },
    {
      label: "Calendar",
      icon: "calendar",
      href: "student-calendar.html"
    },
    {
      label: "Grade Scale",
      icon: "bar-chart",
      href: "student-grade-scale.html"
    }
  ],
  teacher: [
    {
      label: "Dashboard",
      href: "teacher-dashboard.html",
      icon: "home"
    },
    {label: "Courses"},
    {
      id: "course-list-side",
      func: async _ => {
        const api = await apiCall("teacher/courses");
        document.getElementById("course-list-side").innerHTML = "";
        let book = feather.icons.book.toSvg();
        for (let course of api) {
          document.getElementById("course-list-side").innerHTML += `
                <li class="nav-item">
                    <a class="nav-link" id="nav-btn1" href="teacher-course.html?id=${course["course_id"]}">` +
              book +
              `${course.name} (${course["primary_code"]} ${course["secondary_code"]})
                    </a>
                </li>
				`;
        }
      }
    }
  ],
  admin: [
    {
      label: "Dashboard"
    },
    {
      label: "Manage Courses",
      href: "admin-manage-sections.html",
      icon: "list"
    },
    {
      label: "Manage Users",
      href: "admin-manage-users.html",
      icon: "users"
    },
    {
      label: "Action History",
      href: "admin-action-history.html",
      icon: "clock"
    }
  ]
};

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  return false;
}

function getUser(role) {
  let user = window.localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
    if (role && user.role !== role)
      return document.location = "index.html";
    return user;
  } else {
    // if role is set to false, just return false instead of redirecting
    if (role === false)
      return false;
    return document.location = "index.html";
  }
}


async function apiCall(path, method = "GET", data = undefined) {
  let key = "";
  let user = window.localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
    key = user.key;
  }
  try {
    const call = await fetch(`${API_HOST}/${path}`, {
      method: method,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Key': key
      }
    });
    if (call.status === 500) { // HTTP level error handeling, if API is up
      throw("500 Internal Server Error");
    }
    return await call.json();
  } catch (error) { // API error handled, if API is down
    console.error(error);
    throw(error);
  }
}

// form editing
function setValue(name, val) {
  let elem = document.getElementById(name);
  if (elem) elem.value = val;
}

function getValue(name) {
  let elem = document.getElementById(name);
  if (elem)
    return elem.value;
  else return undefined;
}

const LABEL_CLASSES =
    "sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted";

function buildNavigation() {
  let user = getUser(false);
  if (!user)
    return;
  let navItems = [...ROLE_NAVIGATION[user.role], ...ROLE_NAVIGATION.all];
  document.getElementById("sidebarMenu").innerHTML =
      `<div class="position-sticky pt-3"><ul id="nav-items" class="nav flex-column"></ul></div>`;
  let nav = document.getElementById("nav-items");

  for (let navItem of navItems) {
    // this item is just a blank div for dynamic content
    if (navItem.id !== undefined) {
      nav.innerHTML += `<div id="${navItem.id}"></div>`;
      if (navItem.func !== undefined) {
        navItem.func();
      }
    } else if (navItem.href === undefined) { // just a label
      nav.innerHTML += `<h6 class="${LABEL_CLASSES}"><span>${navItem.label}</span></h6>`;
    } else { // full nav item
      let elemId = Math.random().toString(36).slice(-8); // random element id
      let isLink = typeof navItem.href === "string";
      let linkElem = `
        <a class="nav-link" href="${!isLink ? "#" : navItem.href}">
            ${navItem.icon !== undefined ? `<span data-feather="${navItem.icon}"></span>` : ''}
            ${navItem.label}
        </a>`;
      nav.innerHTML += `
        <li class="nav-item" id="${elemId}">
            ${linkElem}
        </li>
      `;

      if (!isLink) { // function link
        document.getElementById(elemId).firstElementChild.addEventListener("click", navItem.href);
      } else {
        // if the current pathname includes the navitem.href, set the link as active
        if (document.location.pathname.indexOf(navItem.href) !== -1)
          document.getElementById(elemId).firstElementChild.className += " active";
      }
    }
  }
  feather.replace();
}

window.addEventListener("load", () => {
  buildNavigation();
});