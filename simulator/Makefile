CC      = gcc
CFLAGS  = -std=c11 -Wall -Wextra -O2
TARGET  = mano

SRCS = main.c state.c control.c bus.c alu.c memory.c io.c assembler.c trace.c shell.c
OBJS = $(SRCS:.c=.o)

.PHONY: all clean run

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(OBJS) $(TARGET)
