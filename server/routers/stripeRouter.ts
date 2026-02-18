import { z } from "zod";
import Stripe from "stripe";
import { router, protectedProcedure } from "../_core/trpc";
import { STRIPE_PRODUCTS, type ProductId } from "../lib/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        productId: z.enum(["featured_weekly", "premium_weekly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = STRIPE_PRODUCTS[input.productId as ProductId];
      
      if (!product) {
        throw new Error("Invalid product ID");
      }

      const origin = ctx.req.headers.origin || "https://msp.investments";
      
      // Find or create Stripe customer
      let customerId: string;
      const existingCustomers = await stripe.customers.list({
        email: ctx.user.email || undefined,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0]!.id;
      } else {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: {
            userId: ctx.user.id.toString(),
          },
        });
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: product.currency,
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: product.price,
              recurring: {
                interval: product.interval,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/pricing?success=true`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: ctx.user.id.toString(),
          productId: input.productId,
        },
        subscription_data: {
          metadata: {
            userId: ctx.user.id.toString(),
            productId: input.productId,
          },
        },
      });

      return { url: session.url! };
    }),
});
