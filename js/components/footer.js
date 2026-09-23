/**
 * /js/components/footer.js
 * Injects the shared site footer into every page.
 */

export function initFooter() {
  const html = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <!-- Brand -->
      <div class="footer-brand">
        <a href="index.html" class="site-logo">VOID<span>WEAR</span></a>
        <p>Heavyweight streetwear for the underground. Designed in LA, dropped worldwide. No restocks. No compromises.</p>
      </div>

      <!-- Shop -->
      <div class="footer-col">
        <h4>Shop</h4>
        <ul>
          <li><a href="shop.html">All Products</a></li>
          <li><a href="shop.html?category=hoodies">Hoodies</a></li>
          <li><a href="shop.html?category=tees">Tees</a></li>
          <li><a href="shop.html?category=bottoms">Bottoms</a></li>
          <li><a href="shop.html?category=accessories">Accessories</a></li>
          <li><a href="shop.html?category=footwear">Footwear</a></li>
          <li><a href="shop.html?badge=new" style="color:var(--clr-accent)">New Drops ↗</a></li>
        </ul>
      </div>

      <!-- Account -->
      <div class="footer-col">
        <h4>Account</h4>
        <ul>
          <li><a href="login.html">Login</a></li>
          <li><a href="signup.html">Sign Up</a></li>
          <li><a href="account.html">My Orders</a></li>
          <li><a href="wishlist.html">Wishlist</a></li>
          <li><a href="account.html">Saved Addresses</a></li>
        </ul>
      </div>

      <!-- Info -->
      <div class="footer-col">
        <h4>Info</h4>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Sizing Guide</a></li>
          <li><a href="#">Shipping & Returns</a></li>
          <li><a href="#">FAQ</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} VOIDWEAR. All rights reserved.</p>
      <div class="footer-socials">
        <a href="#">Instagram</a>
        <a href="#">Twitter</a>
        <a href="#">TikTok</a>
      </div>
    </div>
  </div>
</footer>`;

  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    placeholder.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }
}
