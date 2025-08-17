jQuery_T4NT(document).ready(function ($) {
  // Prevent multiple initializations
  if (window.cartQuantityFixActive) return;
  window.cartQuantityFixActive = true;

  // Flag to prevent simultaneous cart updates
  let isCartUpdating = false;

  // Suppress theme error popups during our cart updates
  const originalAlert = window.alert;
  window.alert = function (message) {
    if (window.t4sCartUpdating) {
      console.log(
        "🚫 Suppressed theme error popup during cart update:",
        message
      );
      return;
    }
    return originalAlert.call(this, message);
  };

  // Wait for theme to load, then apply targeted fix
  setTimeout(function () {
    // ONLY remove cart-specific handlers, not all theme handlers
    $(document).off("change", "#t4s-mini_cart [data-action-change]");
    $(document).off("click", "#t4s-mini_cart [data-quantity-selector]");

    // Our exclusive cart quantity input handler - ONLY for mini cart
    $(document).on(
      "change.cartFix",
      "#t4s-mini_cart [data-cart-item] [data-action-change]",
      function (e) {
        // Prevent simultaneous updates
        if (isCartUpdating) {
          console.log("⏳ Cart update in progress, ignoring");
          e.preventDefault();
          return false;
        }

        const $input = $(this);
        const $cartItem = $input.closest("[data-cart-item]");
        const lineIndex = $cartItem.data("line-index");

        console.log("🔄 MINI CART quantity change detected:", {
          lineIndex: lineIndex,
          newValue: $input.val(),
          element: this,
          cartItemsCount: $("#t4s-mini_cart [data-cart-item]").length,
        });

        if (!lineIndex || lineIndex < 1) {
          console.log(
            "⚠️ No valid line index, letting theme handle this update"
          );
          // Let theme handle it if no line index
          isCartUpdating = false;
          return true; // Don't prevent the event, let theme handle it
        }

        // STOP all event propagation to prevent theme handlers
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const newQuantity = parseInt($input.val()) || 0;

        if (newQuantity < 0) {
          console.log("⚠️ Invalid quantity:", newQuantity);
          return false;
        }

        // Set updating flag and suppress theme error popups
        isCartUpdating = true;
        window.t4sCartUpdating = true; // Flag for theme to suppress errors

        // Disable only THIS specific input during update
        $input.prop("disabled", true);

        // Update cart using proper line index with form data format
        $.ajax({
          url: "/cart/change.js",
          method: "POST",
          dataType: "json",
          data: {
            line: lineIndex,
            quantity: newQuantity,
          },
          beforeSend: function (xhr) {
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          },
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
                console.log(
                  "🔄 Cart content refreshed, items count:",
                  $("#t4s-mini_cart [data-cart-item]").length
                );
              })
              .catch((error) => {
                console.log("❌ Cart refresh failed:", error);
              })
              .finally(() => {
                // Always reset the flags
                isCartUpdating = false;
                window.t4sCartUpdating = false;
              });
          })
          .fail(function (xhr, status, error) {
            console.log("❌ Cart update failed:", {
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText,
              error: error,
              lineIndex: lineIndex,
              quantity: newQuantity,
            });
            alert(
              "Failed to update cart: " +
                (xhr.responseText || error || "Unknown error")
            );
            // Re-enable only this specific input on failure
            $input.prop("disabled", false);
            isCartUpdating = false;
            window.t4sCartUpdating = false;
          });

        return false; // Explicitly return false to stop any remaining propagation
      }
    );

    // Our exclusive quantity selector button handler - ONLY for mini cart
    $(document).on(
      "click.cartFix",
      "#t4s-mini_cart [data-cart-item] [data-quantity-selector]",
      function (e) {
        // Prevent simultaneous updates
        if (isCartUpdating) {
          console.log("⏳ Cart update in progress, ignoring button click");
          e.preventDefault();
          return false;
        }

        const $button = $(this);
        const $cartItem = $button.closest("[data-cart-item]");
        const $input = $cartItem.find("[data-action-change]");
        const lineIndex = $cartItem.data("line-index");

        console.log("🔘 MINI CART quantity button clicked:", {
          lineIndex: lineIndex,
          action: $button.data("quantity-selector"),
          currentValue: $input.val(),
          element: this,
          cartItemsCount: $("#t4s-mini_cart [data-cart-item]").length,
        });

        if (!lineIndex || lineIndex < 1) {
          console.log(
            "⚠️ No valid line index for button, letting theme handle this"
          );
          // Let theme handle it if no line index
          isCartUpdating = false;
          return true; // Don't prevent the event, let theme handle it
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

        console.log("📤 Sending cart button update request:", {
          line: lineIndex,
          quantity: newQty,
        });

        // Update input value
        $input.val(newQty);

        // Set updating flag and suppress theme error popups
        isCartUpdating = true;
        window.t4sCartUpdating = true; // Flag for theme to suppress errors

        // Disable only THIS specific button during update
        $button.prop("disabled", true);

        // Update cart using proper line index with form data format
        $.ajax({
          url: "/cart/change.js",
          method: "POST",
          dataType: "json",
          data: {
            line: lineIndex,
            quantity: newQty,
          },
          beforeSend: function (xhr) {
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          },
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
                console.log(
                  "🔄 Cart content refreshed via button, items count:",
                  $("#t4s-mini_cart [data-cart-item]").length
                );
              })
              .catch((error) => {
                console.log("❌ Cart refresh failed:", error);
              })
              .finally(() => {
                // Always reset the flags
                isCartUpdating = false;
                window.t4sCartUpdating = false;
              });
          })
          .fail(function (xhr, status, error) {
            console.log("❌ Cart button update failed:", {
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText,
              error: error,
              lineIndex: lineIndex,
              quantity: newQty,
            });
            alert(
              "Failed to update cart: " +
                (xhr.responseText || error || "Unknown error")
            );
            // Re-enable only this specific button on failure
            $button.prop("disabled", false);
            isCartUpdating = false;
            window.t4sCartUpdating = false;
          });

        return false; // Explicitly return false to stop any remaining propagation
      }
    );
  }, 1000); // Wait longer for theme to fully load

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
