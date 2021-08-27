PRODUCTION_URL := https://public-store.collected.workers.dev

incr:
	@curl -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/

list_items:
	@curl -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items

add_random_item:
	@curl -X POST -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items
