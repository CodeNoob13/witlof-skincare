jQuery_T4NT(document).ready(function ($) {
  jQuery_T4NT(document).ready(function ($) {
    console.log("🛒 Cart Fix: Taking over cart quantity updates completely");

    // Prevent multiple initializations
    if (window.cartQuantityFixActive) return;
    window.cartQuantityFixActive = true;

    // Wait for theme to load, then override its handlers
    setTimeout(function () {
      // Remove ALL existing cart change handlers to prevent conflicts
      $(document).off("change", "[data-action-change]");
      $(document).off("click", "[data-quantity-selector]");
      $(document).off("click", "[data-increase-qty]");
      $(document).off("click", "[data-decrease-qty]");

      console.log("🔧 Removed theme cart handlers to prevent duplicates");

      // Our exclusive cart quantity input handler
      $(document).on(
        "change.cartFix",
        "#t4s-mini_cart [data-cart-item] [data-action-change]",
        function (e) {
          const $input = $(this);
          const $cartItem = $input.closest("[data-cart-item]");
          const lineIndex = $cartItem.data("line-index");

          console.log("🔄 Cart quantity change detected:", {
            lineIndex: lineIndex,
            newValue: $input.val(),
            element: this,
          });

          if (!lineIndex) {
            console.log("⚠️ No line index found, skipping update");
            return false;
          }

          // STOP all event propagation to prevent theme handlers
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const newQuantity = parseInt($input.val()) || 0;

          // Disable input during update
          $input.prop("disabled", true);

          // Update cart using proper line index
          $.post("/cart/change.js", {
            line: lineIndex,
            quantity: newQuantity,
          })
            .done(function (cart) {
              console.log(
                "✅ Cart updated successfully with line index",
                lineIndex
              );
              // Refresh only the cart content
              fetch("/cart?section_id=mini_cart")
                .then((response) => response.text())
                .then((html) => {
                  const newCartContent = $(html).find("#t4s-mini_cart").html();
                  $("#t4s-mini_cart").html(newCartContent);
                })
                .catch((error) => {
                  console.log("❌ Cart refresh failed:", error);
                  $input.prop("disabled", false);
                });
            })
            .fail(function () {
              console.log("❌ Cart update failed");
              alert("Failed to update cart. Please try again.");
              $input.prop("disabled", false);
            });

          return false; // Explicitly return false to stop any remaining propagation
        }
      );

      // Our exclusive quantity selector button handler
      $(document).on(
        "click.cartFix",
        "#t4s-mini_cart [data-cart-item] [data-quantity-selector]",
        function (e) {
          const $button = $(this);
          const $cartItem = $button.closest("[data-cart-item]");
          const $input = $cartItem.find("[data-action-change]");
          const lineIndex = $cartItem.data("line-index");

          console.log("🔘 Cart quantity button clicked:", {
            lineIndex: lineIndex,
            action: $button.data("quantity-selector"),
            currentValue: $input.val(),
            element: this,
          });

          if (!lineIndex) {
            console.log("⚠️ No line index found for button, skipping");
            return false;
          }

          // STOP all event propagation to prevent theme handlers
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const currentQty = parseInt($input.val()) || 0;
          const isIncrease = $button.data("quantity-selector") === "increase";
          const newQty = isIncrease
            ? currentQty + 1
            : Math.max(0, currentQty - 1);

          // Update input value
          $input.val(newQty);

          // Disable button during update
          $button.prop("disabled", true);

          // Update cart using proper line index
          $.post("/cart/change.js", {
            line: lineIndex,
            quantity: newQty,
          })
            .done(function (cart) {
              console.log(
                "✅ Cart updated successfully via button, line index",
                lineIndex
              );
              // Refresh only the cart content
              fetch("/cart?section_id=mini_cart")
                .then((response) => response.text())
                .then((html) => {
                  const newCartContent = $(html).find("#t4s-mini_cart").html();
                  $("#t4s-mini_cart").html(newCartContent);
                })
                .catch((error) => {
                  console.log("❌ Cart refresh failed:", error);
                  $button.prop("disabled", false);
                });
            })
            .fail(function () {
              console.log("❌ Cart update failed");
              alert("Failed to update cart. Please try again.");
              $button.prop("disabled", false);
            });

          return false; // Explicitly return false to stop any remaining propagation
        }
      );
    }, 1500); // Wait longer for theme to fully load
    const $input = $cartItem.find("[data-action-change]");
    const lineIndex = $cartItem.data("line-index");

    if (!lineIndex) {
      console.log("⚠️ No line index found for button, using default behavior");
      return; // Let default behavior handle it
    }

    console.log("🔘 Cart quantity button fix: Using line index", lineIndex);

    e.preventDefault();
    e.stopImmediatePropagation();

    const currentQty = parseInt($input.val()) || 0;
    const isIncrease = $button.data("quantity-selector") === "increase";
    const newQty = isIncrease ? currentQty + 1 : Math.max(0, currentQty - 1);

    $input.val(newQty);

    // Update cart using proper line index
    $.post("/cart/change.js", {
      line: lineIndex,
      quantity: newQty,
    })
      .done(function (cart) {
        console.log("✅ Cart updated with line index via button");
        // Refresh only the cart content
        fetch("/cart?section_id=mini_cart")
          .then((response) => response.text())
          .then((html) => {
            const newCartContent = $(html).find("#t4s-mini_cart").html();
            $("#t4s-mini_cart").html(newCartContent);
          });
      })
      .fail(function () {
        console.log("❌ Cart update failed");
        alert("Failed to update cart. Please try again.");
      });
  });

  console.log(
    "🔧 Cart quantity fix initialized - only affects cart, not product pages"
  );

  /**
   *  Variant selection changed
   *  data-variant-toggle="{{ variant.id }}"
   */
  $(document).on("variant:changed", function (evt) {
    // console.log( evt.currentVariant );
    // $('[data-variant-toggle]').hide(0);
    // $('[data-variant-toggle="'+evt.currentVariant.id+'"]').show(0);
  });
});
