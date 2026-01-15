// Package main is the entry point for the API.
package main

import (
	"fmt"

	"app/internal/app"
)

func main() {
	fmt.Println(app.Greet("World"))
}
