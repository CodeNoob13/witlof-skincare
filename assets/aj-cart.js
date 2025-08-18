document.addEventListener("alpine:init", () => {
  Alpine.data("ajCart", () => ({
    cartPrice: 0,
    cartDiscount: 0,
    cart: {},
    allProducts: [],
    totalComparePrice: 0,

    init() {
      this.fetchCart();
      document.addEventListener("cart:refresh", () => {});
      document.addEventListener("cart:updated", () => {
        this.fetchCart();
        this.fetchProducts();
      });
      document.addEventListener("cart:change", () => {
        this.fetchCart();
      });
      document.addEventListener("cart:requestComplete", () => {
        this.fetchCart();
      });
    },
    async fetchCart() {
      this.fetchAllProducts();

      fetch("/cart.js")
        .then((res) => res.json())
        .then((cart) => {
          this.cart = cart;
          this.cartPrice = cart.total_price / 100;
          console.log(this.cart.item_count);
          this.getCartProducts();
          this.getTotalComparePrice();
        });
    },

    async getCartProducts() {
      // Get total compare at price
      this.cartProducts = this.cart.items.map((item) => {
        const product = this.allProducts.find((p) => p.id === item.product_id);
        if (product) {
          const variant = product.variants.find(
            (v) => v.id === item.variant_id
          );
          return {
            ...item,
            compare_at_price: parseFloat(variant.compare_at_price),
          };
        }
      });
    },

    async getTotalComparePrice() {
      let totalComparePrice = 0;

      this.cartProducts.forEach((item) => {
        if (item.compare_at_price) {
          totalComparePrice += item.compare_at_price * item.quantity;
        } else {
          totalComparePrice += (item.price / 100) * item.quantity;
        }
      });

      this.totalComparePrice = totalComparePrice;

      console.log(this.totalComparePrice);
    },

    fetchAllProducts() {
      fetch("/products.json")
        .then((response) => response.json())
        .then((data) => {
          this.allProducts = data.products;
          // console.log("All products:", this.allProducts);
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
        });
    },
  }));
});
