import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, MoreHorizontal, Search, Filter, Calendar, Building, Package, Paperclip, MessageSquare, CheckSquare, Upload, Image, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useArtwork, safeJsonParse, getPriorityColor } from "./hooks";

export default function ArtworkPage() {
  const {
    // State
    searchQuery,
    setSearchQuery,
    showNewCardDialog,
    setShowNewCardDialog,
    showNewColumnDialog,
    setShowNewColumnDialog,
    showEditCardDialog,
    setShowEditCardDialog,
    uploadedFiles,
    editUploadedFiles,
    filePreviews,
    editFilePreviews,
    existingAttachments,
    fileInputRef,
    editFileInputRef,

    // Forms
    cardForm,
    editCardForm,
    columnForm,

    // Data
    columns,
    cards,
    companies,
    orders,
    isLoading,

    // Mutations
    createColumnMutation,
    createCardMutation,
    updateCardMutation,

    // Handlers
    handleFileUpload,
    removeFile,
    handleEditFileUpload,
    removeEditFile,
    removeExistingAttachment,
    handleCreateCard,
    onCreateCard,
    onCreateColumn,
    onEditCard,
    handleCardClick,
    onDragEnd,
  } = useArtwork();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="w-80 h-96 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Artwork Management</h1>
          <p className="text-gray-600 mt-1">Kanban-style workflow for artwork projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search artwork cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Column</DialogTitle>
                <DialogDescription>
                  Add a new column to your artwork board
                </DialogDescription>
              </DialogHeader>
              <Form {...columnForm}>
                <form onSubmit={columnForm.handleSubmit(onCreateColumn)} className="space-y-4">
                  <FormField
                    control={columnForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Column Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter column name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={columnForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewColumnDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createColumnMutation.isPending}>
                      Create Column
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map((column: any) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-900 text-sm">{column.name}</h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {cards.filter((card: any) => card.columnId === column.id).length}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Column</DropdownMenuItem>
                      <DropdownMenuItem>Add Card</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete Column</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Cards Container */}
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3 min-h-[400px] bg-gray-50/50 rounded-lg p-3 border-2 border-dashed border-gray-200"
                  >
                    {cards
                      .filter((card: any) =>
                        card.columnId === column.id &&
                        card.title?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((card: any, index: number) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-gray-300"
                              onClick={() => handleCardClick(card)}
                            >
                              {/* Card Image Preview */}
                              {card.attachments && (() => {
                                const attachments = safeJsonParse(card.attachments, []);
                                const imageAttachment = attachments.find((att: any) => att.fileType?.startsWith('image/'));
                                if (imageAttachment) {
                                  return (
                                    <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                                      <img
                                        src={imageAttachment.fileUrl}
                                        alt={card.title}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                        <Image className="w-3 h-3 inline mr-1" />
                                        {attachments.length}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-sm font-medium text-gray-900 leading-tight">
                                    {card.title}
                                  </CardTitle>
                                  {card.priority && (
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(card.priority)} flex-shrink-0 mt-1`}></div>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0 space-y-3">
                                {card.description && (
                                  <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
                                )}

                                {/* Tags Row */}
                                <div className="flex flex-wrap gap-1">
                                  {card.companyName && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                      <Building className="w-3 h-3 mr-1" />
                                      {card.companyName}
                                    </Badge>
                                  )}
                                  {card.orderNumber && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                                      <Package className="w-3 h-3 mr-1" />
                                      #{card.orderNumber}
                                    </Badge>
                                  )}
                                </div>

                                {/* Card Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    {card.dueDate && (
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(card.dueDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {card.attachments && (() => {
                                      const attachments = safeJsonParse(card.attachments, []);
                                      return attachments.length > 0 ? (
                                        <div className="flex items-center text-xs text-gray-500">
                                          <Paperclip className="w-3 h-3" />
                                          <span className="ml-1">{attachments.length}</span>
                                        </div>
                                      ) : null;
                                    })()}
                                    {card.comments && safeJsonParse(card.comments, []).length > 0 && (
                                      <div className="flex items-center text-xs text-gray-500">
                                        <MessageSquare className="w-3 h-3" />
                                        <span className="ml-1">{safeJsonParse(card.comments, []).length}</span>
                                      </div>
                                    )}
                                    {card.checklist && safeJsonParse(card.checklist, []).length > 0 && (
                                      <div className="flex items-center text-xs text-gray-500">
                                        <CheckSquare className="w-3 h-3" />
                                        <span className="ml-1">{safeJsonParse(card.checklist, []).length}</span>
                                      </div>
                                    )}
                                    {card.assignedUserName && (
                                      <UserAvatar
                                        name={card.assignedUserName}
                                        size="sm"
                                      />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}

                    {/* Add Card Button */}
                    <Button
                      variant="ghost"
                      className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-white/50 transition-colors"
                      onClick={() => handleCreateCard(column.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add a card
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Card Dialog */}
      <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Artwork Card</DialogTitle>
            <DialogDescription>
              Add a new artwork task to your board
            </DialogDescription>
          </DialogHeader>
          <Form {...cardForm}>
            <form onSubmit={cardForm.handleSubmit(onCreateCard)} className="space-y-4">
              <FormField
                control={cardForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter card title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter card description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orders.map((order: any) => (
                          <SelectItem key={order.id} value={order.id}>
                            #{order.orderNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              <div className="space-y-3">
                <FormLabel>Artwork Files</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".ai,.eps,.jpeg,.jpg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {uploadedFiles.length === 0 ? (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload artwork files (.ai, .eps, .jpeg, .png, .pdf)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Files
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{uploadedFiles.length} file(s) selected</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Add More
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map(file => (
                          <div key={file.name} className="relative bg-gray-50 rounded p-2 text-xs">
                            {filePreviews[file.name] ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={filePreviews[file.name]}
                                  alt={file.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                                <span className="truncate">{file.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                  <Paperclip className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="truncate">{file.name}</span>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => removeFile(file.name)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewCardDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCardMutation.isPending}>
                  Create Card
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={showEditCardDialog} onOpenChange={setShowEditCardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>
              Update the artwork card details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editCardForm}>
            <form onSubmit={editCardForm.handleSubmit(onEditCard)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editCardForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter card title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCardForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editCardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter card description" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editCardForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company: any) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCardForm.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders.map((order: any) => (
                            <SelectItem key={order.id} value={order.id}>
                              #{order.orderNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editCardForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Management Section */}
              <div className="space-y-3">
                <FormLabel>Artwork Files</FormLabel>

                {/* Existing Attachments */}
                {existingAttachments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current Files:</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {existingAttachments.map(attachment => (
                        <div key={attachment.id} className="relative bg-gray-50 rounded p-2 text-xs">
                          {attachment.fileType?.startsWith('image/') && attachment.fileUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={attachment.fileUrl}
                                alt={attachment.fileName}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span className="truncate">{attachment.fileName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                              </div>
                              <span className="truncate">{attachment.fileName}</span>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => removeExistingAttachment(attachment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    multiple
                    accept=".ai,.eps,.jpeg,.jpg,.png,.pdf"
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />

                  {editUploadedFiles.length === 0 ? (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Add more artwork files (.ai, .eps, .jpeg, .png, .pdf)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        Choose Files
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{editUploadedFiles.length} new file(s) selected</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editFileInputRef.current?.click()}
                        >
                          Add More
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {editUploadedFiles.map(file => (
                          <div key={file.name} className="relative bg-gray-50 rounded p-2 text-xs">
                            {editFilePreviews[file.name] ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={editFilePreviews[file.name]}
                                  alt={file.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                                <span className="truncate">{file.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                  <Paperclip className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="truncate">{file.name}</span>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => removeEditFile(file.name)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditCardDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCardMutation.isPending}>
                  {updateCardMutation.isPending ? "Updating..." : "Update Card"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
