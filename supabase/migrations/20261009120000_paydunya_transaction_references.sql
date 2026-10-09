-- Keep the checkout token separate from the final PSP transaction reference.

alter table public.payment_orders
  add column checkout_token text,
  add column receipt_identifier text,
  add column receipt_url text;

update public.payment_orders
set checkout_token = provider_reference
where provider_reference is not null;

create unique index payment_orders_checkout_token_unique
  on public.payment_orders (provider, checkout_token)
  where checkout_token is not null;
