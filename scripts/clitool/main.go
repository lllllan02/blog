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
	"github.com/spf13/cobra"
)

const defaultContentDir = "content"

// 全局参数变量
var (
	targetDir string
	title     string
	tags      string
	wiki      string
	isCard    bool
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "clitool",
		Short: "Blog management CLI tool",
		Long:  `A CLI tool for managing blog content, supporting both interactive and one-click modes.`,
		Run: func(cmd *cobra.Command, args []string) {
			// 默认运行交互式菜单
			runInteractive()
		},
	}

	// New 命令组
	var newCmd = &cobra.Command{
		Use:   "new",
		Short: "Create new content (card, doc, dir)",
	}

	// New Card 命令
	var newCardCmd = &cobra.Command{
		Use:   "card [filename]",
		Short: "Create a new card post",
		Args:  cobra.MaximumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			if len(args) == 0 {
				interactiveCreate("card")
			} else {
				runOneClick("card", args)
			}
		},
	}

	// New Doc 命令
	var newDocCmd = &cobra.Command{
		Use:   "doc [filename]",
		Short: "Create a new document post",
		Args:  cobra.MaximumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			if len(args) == 0 {
				interactiveCreate("doc")
			} else {
				runOneClick("doc", args)
			}
		},
	}

	// New Dir 命令
	var newDirCmd = &cobra.Command{
		Use:   "dir [dirname]",
		Short: "Create a new directory",
		Args:  cobra.MaximumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			if len(args) == 0 {
				interactiveCreate("dir")
			} else {
				runOneClick("dir", args)
			}
		},
	}

	// 注册标志 (Flags)
	newCmd.PersistentFlags().StringVarP(&targetDir, "dir", "d", defaultContentDir, "Target directory path")
	newCmd.PersistentFlags().StringVarP(&title, "title", "t", "", "Title of the post (defaults to filename if empty)")
	newCmd.PersistentFlags().StringVar(&tags, "tags", "", "Comma-separated tags")
	newCmd.PersistentFlags().StringVar(&wiki, "wiki", "", "Comma-separated wiki terms")
	newCmd.PersistentFlags().BoolVar(&isCard, "card", false, "Set card to true")

	// 组装命令
	newCmd.AddCommand(newCardCmd, newDocCmd, newDirCmd)
	rootCmd.AddCommand(newCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

// ==========================================
// 交互式逻辑 (Interactive Mode)
// ==========================================

func runInteractive() {
	prompt := promptui.Select{
		Label: "Select Action",
		Items: []string{"Create New Card", "Create New Doc", "Create New Directory", "Exit"},
	}

	_, result, err := prompt.Run()
	if err != nil {
		return
	}

	switch result {
	case "Create New Card":
		interactiveCreate("card")
	case "Create New Doc":
		interactiveCreate("doc")
	case "Create New Directory":
		interactiveCreate("dir")
	case "Exit":
		return
	}
}

func interactiveCreate(mode string) {
	// 1. 选择目录
	selectedPath := selectDirectoryInteractive()

	// 2. 输入名称
	label := "Enter File Name (without .md)"
	if mode == "dir" {
		label = "Enter New Directory Name"
	}

	validate := func(input string) error {
		if len(strings.TrimSpace(input)) == 0 {
			return fmt.Errorf("name cannot be empty")
		}
		return nil
	}

	prompt := promptui.Prompt{
		Label:    label,
		Validate: validate,
	}

	name, err := prompt.Run()
	if err != nil {
		fmt.Println("Cancelled")
		return
	}

	// 3. 执行创建
	executeCreate(mode, selectedPath, name, name) // 交互模式下 title 默认等于 name
}

func selectDirectoryInteractive() string {
	selectedPath := defaultContentDir
	for {
		subDirs, err := getSubDirs(selectedPath)
		if err != nil {
			log.Fatal(err)
		}

		options := []string{"[Select this directory]"}
		options = append(options, subDirs...)
		if selectedPath != defaultContentDir {
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
			log.Fatal("Selection cancelled")
		}

		if result == "[Select this directory]" {
			break
		} else if result == ".. (Back)" {
			selectedPath = filepath.Dir(selectedPath)
		} else {
			selectedPath = filepath.Join(selectedPath, result)
		}
	}
	return selectedPath
}

// ==========================================
// 一键式逻辑 (One-Click Mode)
// ==========================================

func runOneClick(mode string, args []string) {
	name := ""
	if len(args) > 0 {
		name = args[0]
	} else {
		log.Fatal("Filename is required")
	}

	// 如果没有指定 title，默认使用 name
	postTitle := title
	if postTitle == "" {
		postTitle = name
	}

	executeCreate(mode, targetDir, name, postTitle)
}

// ==========================================
// 核心逻辑 (Core Logic)
// ==========================================

func executeCreate(mode, dirPath, name, postTitle string) {
	if mode == "dir" {
		newDirPath := filepath.Join(dirPath, name)
		err := os.MkdirAll(newDirPath, 0755)
		if err != nil {
			log.Fatal(err)
		}
		// 自动在该目录下创建 index.md
		targetPath := filepath.Join(newDirPath, "index.md")
		createFile(targetPath, postTitle, false)
		fmt.Printf("\n✨ Created Directory: \033[32m%s\033[0m\n", newDirPath)
	} else {
		// 如果命令行指定了 --card，则优先使用；否则根据 mode 判断
		cardValue := isCard
		if !cardValue {
			cardValue = (mode == "card")
		}
		targetPath := filepath.Join(dirPath, name+".md")
		createFile(targetPath, postTitle, cardValue)
	}
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
	// 确保父目录存在
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatal(err)
	}

	date := time.Now().Format("2006-01-02 15:04:05")
	u := uuid.New()
	alias := strings.ToLower(u.String())

	// 处理 tags
	var tagsStr string
	if tags != "" {
		tagList := strings.Split(tags, ",")
		for i, t := range tagList {
			tagList[i] = strings.TrimSpace(t)
		}
		// 格式化为 YAML 数组格式 [tag1, tag2]
		tagsStr = fmt.Sprintf("[%s]", strings.Join(tagList, ", "))
	}

	// 处理 wiki
	var wikiPart string
	if wiki != "" {
		wikiList := strings.Split(wiki, ",")
		for i, w := range wikiList {
			wikiList[i] = strings.TrimSpace(w)
		}
		// 格式化为 YAML 数组格式 [term1, term2]
		wikiPart = fmt.Sprintf("\nwiki: [%s]", strings.Join(wikiList, ", "))
	}

	content := fmt.Sprintf(`---
title: %s
aliases: %s
date: %s
card: %v
order:
tags: %s%s
---
`, title, alias, date, isCard, tagsStr, wikiPart)

	err := os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("✨ Created File: \033[32m%s\033[0m (card: %v)\n", path, isCard)
}
