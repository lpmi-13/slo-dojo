FROM golang:1.19-alpine as builder

WORKDIR /app

COPY . /app

RUN CGO_ENABLED=0 go build -ldflags "-w -s" -o /app/simple-insert-sellers

FROM scratch

COPY --from=builder /app/simple-insert-sellers /simple-insert-sellers

# in the compose stack, we pass the DNS for the app container as defined by traefik
# directory to the process as an argument
CMD ["/simple-insert-sellers", "5"]
