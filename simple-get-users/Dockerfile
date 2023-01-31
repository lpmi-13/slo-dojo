FROM golang:1.19-alpine as builder

WORKDIR /app

COPY . /app

RUN CGO_ENABLED=0 go build -ldflags "-w -s" -o /app/simple-get-users

FROM scratch

COPY --from=builder /app/simple-get-users /simple-get-users

# in the compose stack, we pass the DNS for the app container
# directory to the process as an argument
CMD ["/simple-get-users", "app"]