PRODUCTION_URL := https://public-store.collected.workers.dev

production:
	wrangler publish

staging:
	wrangler preview

incr:
	@curl -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/incr

list_items:
	@curl -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items

add_random_item:
	@curl -X POST -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items

replace_first_item:
	@curl -X PUT -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items/0

replace_hundredth_item:
	@curl -X PUT -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items/100

replace_invalid_item:
	@curl -X PUT -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items/abc

delete_items:
	@curl -X DELETE -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items

stream_items:
	@curl -w '\n Latency: %{time_total}s\n' $(PRODUCTION_URL)/items/event-stream
