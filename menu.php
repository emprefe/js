<!-- layout_manager/menu/menu.php -->
  <style>

    
    /* Button Styles */
   .menu_button {
  height: 35px;
  width: 100px;
  padding: 5px;
  margin: 0px 2px;
  border-radius: 25px;
  background-color: #008080;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;  
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
    }
    
    .menu_button:hover {
      background-color: #f0f0f0;
    }
    
.drag_content {
    position: fixed;
    bottom: 65px;
    right: 65px;
  height: 50px;
  width: 500px;
  padding: 5px 55px 5px 5px;
  border-radius: 25px;
  background-color: #5E35B1;
  color: white;
  display: flex;
  justify-content: center;
  align-items: left;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1419;
  
}

.drag_menu {
    position: fixed;
    bottom: 65px;
    right: 65px;
  display: flex;
  z-index: 1420;
  height: 50px;
  width: 50px;
  border-radius: 100px;
  
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);  
  justify-content: center;
  align-items: center;
}


.buttons_float_menu {
  justify-content: center;
  align-items: center;    
  display: flex;
  z-index: 4201;
  border-radius: 100px 0 0 100px; /* start with left side */
  height: 50px;
  width: 23px;
}

.left {
  border-radius: 100px 0 0 100px;
}

.right {
  border-radius: 0 100px 100px 0;
}

.myMenu_admin{
    overflow-x: auto;
    display: flex;
    width: 435px;
  justify-content: center;
  align-items: center;    
}

  </style>
  



<div id="drag_menu" class="drag_menu">

<div>
<button id="toggle_menu" class="buttons_float_menu left" onmousedown="toggle_obj('drag_content', 'none', 'flex');" title="Toggle Menu">&#9776;</button>
</div>
<div>
<button id="drag_button" class="buttons_float_menu right" onmouseover="drag_obj('drag_button', 'drag_menu', 'drag_content');" onmousedown="drag_obj('drag_button', 'drag_menu', 'drag_content');" title="Drag Me">&#9737;</button>
</div>

</div>
<div id="drag_content" class="drag_content">

  <!-- This div contains our buttons -->
  <div id="myMenu_admin">
    <button class="menu_button" id="btn-dashboard">Dashboard</button>
    <button class="menu_button" id="btn-WYSIWYG">WYSIWYG</button>
    <button class="menu_button" id="btn-layout">Layout</button>
    <button class="menu_button" id="btn-users">Users</button>
    <button class="menu_button" id="btn-faq">FAQ</button>
    <button class="menu_button" id="btn-forums">Forums</button>
    <button class="menu_button" id="btn-security">Security</button>
    <button class="menu_button" id="btn-help">Help</button>
  </div>

</div>



  <!-- Initialize the menu -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize with custom element
      const menu = menu_carousel('myMenu_admin');
      
      // Add click handlers for each button
      document.getElementById('btn-WYSIWYG').addEventListener('mousedown', function() {
      toggle_obj('content-wysiwyg-wrapper', "block", "none");
      });
      
      document.getElementById('btn-dashboard').addEventListener('click', function() {
      //  alert('dashboard button clicked');
      });
      
      document.getElementById('btn-layout').addEventListener('click', function() {

      });
      
      document.getElementById('btn-users').addEventListener('click', function() {

      });
      
      document.getElementById('btn-faq').addEventListener('click', function() {

      });
      
      document.getElementById('btn-forums').addEventListener('click', function() {
      //  alert('Forums button clicked');
      });
      
      document.getElementById('btn-security').addEventListener('click', function() {
      //  alert('Security button clicked');
      });
      
      document.getElementById('btn-help').addEventListener('click', function() {
      //  alert('Help button clicked');
      });
    });
  </script>
