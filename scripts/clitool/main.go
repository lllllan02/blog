package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/manifoldco/promptui"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: clitool [card|doc|dir|create-file]")
		return
	}

	mode := os.Args[1]
	contentDir := "content"

	if mode == "create-file" {
		if len(os.Args) < 4 {
			log.Fatal("Usage: clitool create-file [filename] [title]")
		}
		createFile(os.Args[2], os.Args[3], false)
		return
	}

	if mode != "card" && mode != "doc" && mode != "dir" {
		log.Fatal("Usage: clitool [card|doc|dir|create-file]")
	}

	// 交互式逐级选择目录
	selectedPath := contentDir
	for {
		subDirs, err := getSubDirs(selectedPath)
		if err != nil {
			log.Fatal(err)
		}

		options := []string{"[Select this directory]"}
		options = append(options, subDirs...)
		if selectedPath != contentDir {
			options = append(options, ".. (Back)")
		}

		templates := &promptui.SelectTemplates{
			Label:    "{{ . }}",
			Active:   "▸ \033[36m{{ . }}\033[0m",
			Inactive: "  {{ . }}",
			Selected: "✔ \033[32mCurrent Path:\033[0m {{ . }}",
		}

		prompt := promptui.Select{
			Label:     fmt.Sprintf("Current: %s", selectedPath),
			Items:     options,
			Templates: templates,
			Size:      10,
		}

		_, result, err := prompt.Run()
		if err != nil {
			fmt.Println("Cancelled")
			return
		}

		if result == "[Select this directory]" {
			break
		} else if result == ".. (Back)" {
			selectedPath = filepath.Dir(selectedPath)
		} else {
			selectedPath = filepath.Join(selectedPath, result)
		}
	}

	// 输入名称
	var label string
	if mode == "card" || mode == "doc" {
		label = "Enter File Name (without .md)"
	} else {
		label = "Enter New Directory Name"
	}

	inputPrompt := promptui.Prompt{
		Label: label,
		Validate: func(input string) error {
			if len(strings.TrimSpace(input)) == 0 {
				return fmt.Errorf("name cannot be empty")
			}
			return nil
		},
	}

	name, err := inputPrompt.Run()
	if err != nil {
		fmt.Println("Cancelled")
		return
	}

	// 只有 card 命令将 card 设为 true，doc 和 dir 均为 false
	isCard := mode == "card"

	var targetPath string
	if mode == "card" || mode == "doc" {
		targetPath = filepath.Join(selectedPath, name+".md")
	} else {
		newDirPath := filepath.Join(selectedPath, name)
		err := os.MkdirAll(newDirPath, 0755)
		if err != nil {
			log.Fatal(err)
		}
		targetPath = filepath.Join(newDirPath, "index.md")
	}

	createFile(targetPath, name, isCard)
}

func getSubDirs(path string) ([]string, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var dirs []string
	for _, entry := range entries {
		if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			dirs = append(dirs, entry.Name())
		}
	}
	sort.Strings(dirs)
	return dirs, nil
}

func createFile(path string, title string, isCard bool) {
	date := time.Now().Format("2006-01-02 15:04:05")
	u := uuid.New()
	alias := strings.ToLower(u.String())

	content := fmt.Sprintf(`---
title: %s
aliases: %s
date: %s
card: %v
order:
tags:
---
`, title, alias, date, isCard)

	err := os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\n✨ Created: \033[32m%s\033[0m (card: %v)\n", path, isCard)
}
